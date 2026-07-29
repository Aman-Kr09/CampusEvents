/**
 * jobFeedService.js
 * ─────────────────
 * Fetches live off-campus job listings from multiple free external APIs
 * and normalizes them into CampusEvents' OffCampusJob schema shape.
 *
 * Sources used (all free, no API key required):
 *   1. Remotive.io   — https://remotive.com/api/remote-jobs
 *   2. Himalayas.app — https://himalayas.app/jobs/api
 */

const { cacheGet, cacheSet } = require('../config/redisClient');

const EXTERNAL_CACHE_KEY = 'external_jobs_feed';
const EXTERNAL_CACHE_TTL = 30 * 60; // 30 minutes

// ── Fetch helper with timeout ────────────────────────────────────────────────
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Normalize a Remotive job ─────────────────────────────────────────────────
function normalizeRemotive(job) {
  return {
    _id: `remotive_${job.id}`,
    title: job.title || 'Software Engineer',
    company: job.company_name || 'Unknown Company',
    location: job.candidate_required_location || 'Remote',
    employmentType: mapJobType(job.job_type),
    experience: null,
    salary: job.salary || null,
    source: 'Remotive',
    sourceLogo: 'https://remotive.com/favicon.ico',
    logo: job.company_logo || null,
    applyUrl: job.url || '#',
    skills: job.tags || [],
    description: stripHtml(job.description || '').slice(0, 300),
    deadline: null,
    postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
    _external: true
  };
}

// ── Normalize a Himalayas job ────────────────────────────────────────────────
function normalizeHimalayas(job) {
  return {
    _id: `himalayas_${job.slug || job.id}`,
    title: job.title || 'Software Engineer',
    company: job.companyName || job.company?.name || 'Unknown Company',
    location: job.locationRestrictions?.join(', ') || 'Remote',
    employmentType: 'Full-Time',
    experience: null,
    salary: job.salary ? `${job.salary}` : null,
    source: 'Himalayas',
    sourceLogo: 'https://himalayas.app/favicon.ico',
    logo: job.companyLogo || job.company?.logo || null,
    applyUrl: job.applicationLink || `https://himalayas.app/jobs/${job.slug}`,
    skills: job.skills?.map(s => s.name || s) || [],
    description: stripHtml(job.description || job.excerpt || '').slice(0, 300),
    deadline: null,
    postedAt: job.createdAt ? new Date(job.createdAt) : new Date(),
    _external: true
  };
}

// ── Map Remotive job_type → our employmentType enum ─────────────────────────
function mapJobType(type) {
  if (!type) return 'Full-Time';
  const t = type.toLowerCase();
  if (t.includes('intern')) return 'Internship';
  if (t.includes('contract')) return 'Contract';
  if (t.includes('part')) return 'Part-Time';
  return 'Full-Time';
}

// ── Strip HTML tags from description ────────────────────────────────────────
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Tech-role title allowlist & blocklist ────────────────────────────────────
// A job passes if its title contains at least one ALLOWED keyword
// AND does not contain any BLOCKED keyword.
const TECH_TITLE_ALLOW = [
  'software', 'engineer', 'developer', 'sde', 'swe',
  'backend', 'frontend', 'full stack', 'fullstack', 'full-stack',
  'data', 'analyst', 'analytics', 'data scientist', 'data engineer',
  'machine learning', 'ml engineer', 'ai engineer', 'deep learning',
  'devops', 'cloud', 'platform', 'infrastructure', 'site reliability', 'sre',
  'mobile', 'android', 'ios', 'react', 'node', 'python', 'java', 'golang',
  'qa', 'quality assurance', 'test engineer', 'automation engineer',
  'security engineer', 'cybersecurity', 'network engineer',
  'tech analyst', 'technology analyst', 'systems analyst', 'it analyst',
  'product engineer', 'release engineer', 'embedded', 'firmware',
  'database', 'dba', 'big data', 'blockchain', 'web developer'
];

const TECH_TITLE_BLOCK = [
  'marketing', 'sales', 'account manager', 'account executive',
  'hr ', 'human resources', 'recruiter', 'talent acquisition',
  'finance', 'accounting', 'controller', 'payroll',
  'designer', 'graphic', 'ux writer', 'copywriter', 'content writer',
  'customer success', 'customer support', 'community manager',
  'operations manager', 'business development', 'partnerships',
  'legal', 'compliance', 'office manager'
];

function isTechRole(title = '') {
  const t = title.toLowerCase();
  const hasBlock = TECH_TITLE_BLOCK.some(kw => t.includes(kw));
  if (hasBlock) return false;
  const hasAllow = TECH_TITLE_ALLOW.some(kw => t.includes(kw));
  return hasAllow;
}

// ── Primary fetcher: Remotive (tech categories only) ─────────────────────────
async function fetchRemotive() {
  try {
    // Only tech-specific Remotive categories
    const categories = ['software-dev', 'data', 'devops-sysadmin', 'testing', 'mobile'];
    const results = await Promise.allSettled(
      categories.map(cat =>
        fetchWithTimeout(`https://remotive.com/api/remote-jobs?category=${cat}&limit=15`)
      )
    );

    const jobs = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.jobs) {
        jobs.push(...r.value.jobs.map(normalizeRemotive));
      }
    }
    console.log(`[JobFeed] Remotive: fetched ${jobs.length} jobs (before filter)`);
    return jobs;
  } catch (err) {
    console.warn('[JobFeed] Remotive fetch failed:', err.message);
    return [];
  }
}

// ── Secondary fetcher: Himalayas (targeted tech queries) ─────────────────────
async function fetchHimalayas() {
  try {
    const queries = ['software+engineer', 'data+engineer', 'backend+developer', 'frontend+developer'];
    const results = await Promise.allSettled(
      queries.map(q =>
        fetchWithTimeout(`https://himalayas.app/jobs/api?limit=8&q=${q}`)
      )
    );

    const jobs = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.jobs) {
        jobs.push(...r.value.jobs.map(normalizeHimalayas));
      }
    }
    console.log(`[JobFeed] Himalayas: fetched ${jobs.length} jobs (before filter)`);
    return jobs;
  } catch (err) {
    console.warn('[JobFeed] Himalayas fetch failed:', err.message);
    return [];
  }
}

// ── Main export: get merged external jobs (with Redis caching) ───────────────
async function getExternalJobs() {
  // Check Redis cache first
  const cached = await cacheGet(EXTERNAL_CACHE_KEY);
  if (cached) {
    console.log('[JobFeed] Serving external jobs from cache');
    return cached;
  }

  // Fetch both sources concurrently
  const [remotiveJobs, himalayasJobs] = await Promise.all([
    fetchRemotive(),
    fetchHimalayas()
  ]);

  // Merge, de-duplicate by applyUrl, then apply tech-role filter
  const seen = new Set();
  const merged = [];
  for (const job of [...remotiveJobs, ...himalayasJobs]) {
    if (!seen.has(job.applyUrl) && isTechRole(job.title)) {
      seen.add(job.applyUrl);
      merged.push(job);
    }
  }

  // Sort by postedAt descending
  merged.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  // Cache for 30 minutes
  if (merged.length > 0) {
    await cacheSet(EXTERNAL_CACHE_KEY, merged, EXTERNAL_CACHE_TTL);
  }

  console.log(`[JobFeed] Tech jobs after filter: ${merged.length}`);
  return merged;
}

module.exports = { getExternalJobs };
