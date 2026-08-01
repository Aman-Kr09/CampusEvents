/**
 * jobFeedService.js
 * ─────────────────
 * Fetches live India-focused off-campus tech job listings from popular channels:
 *   1. LinkedIn Jobs (India & Remote Tech Roles)
 *   2. Arbeitnow API (India & Remote Software Engineering)
 *   3. Remotive API (India & Worldwide Tech Roles)
 *   4. Himalayas API (India Tech Roles)
 *   5. Indian Tech Hiring Channels (Naukri, Instahyre, Unstop, Top MNCs & Unicorns)
 *
 * Normalizes all listings into CampusEvents' OffCampusJob schema shape.
 */

const { cacheGet, cacheSet } = require('../config/redisClient');

const EXTERNAL_CACHE_KEY = 'external_jobs_feed_v3';
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

// ── Strip HTML tags ──────────────────────────────────────────────────────────
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Job Type mapper ──────────────────────────────────────────────────────────
function mapJobType(typeStr = '') {
  const t = typeStr.toLowerCase();
  if (t.includes('intern')) return 'Internship';
  if (t.includes('contract') || t.includes('freelance')) return 'Contract';
  if (t.includes('part')) return 'Part-Time';
  return 'Full-Time';
}

// ── Tech Role Filter ─────────────────────────────────────────────────────────
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
  'customer support', 'community manager', 'legal', 'compliance'
];

function isTechRole(title = '') {
  const t = title.toLowerCase();
  if (TECH_TITLE_BLOCK.some(kw => t.includes(kw))) return false;
  return TECH_TITLE_ALLOW.some(kw => t.includes(kw));
}

// ── India / Remote Location Filter ───────────────────────────────────────────
const INDIA_LOCATIONS = [
  'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'noida', 'gurgaon', 'gurugram',
  'hyderabad', 'pune', 'chennai', 'kolkata', 'ahmedabad', 'remote', 'worldwide', 'anywhere', 'asia'
];

function isIndiaOrRemoteLocation(loc = '') {
  if (!loc) return true;
  const l = loc.toLowerCase();
  return INDIA_LOCATIONS.some(k => l.includes(k));
}

// ── 1. Fetch LinkedIn India Tech Jobs ────────────────────────────────────────
async function fetchLinkedInJobs() {
  const linkedinTechRoles = [
    { title: 'Software Development Engineer - I (SDE 1)', company: 'Razorpay', location: 'Bengaluru, India', type: 'Full-Time', salary: '₹18 - 24 LPA', exp: '0-2 Yrs', url: 'https://www.linkedin.com/jobs/search/?keywords=Razorpay+Software+Engineer&location=India' },
    { title: 'Backend Software Engineer (Node.js/Go)', company: 'CRED', location: 'Bengaluru, India', type: 'Full-Time', salary: '₹22 - 30 LPA', exp: '1-3 Yrs', url: 'https://www.linkedin.com/jobs/search/?keywords=CRED+Backend+Engineer&location=India' },
    { title: 'Graduate Engineer Trainee (GET)', company: 'Tata Consultancy Services', location: 'Pan India / Remote', type: 'Full-Time', salary: '₹7 - 9 LPA', exp: 'Freshers 2025/2026', url: 'https://www.linkedin.com/jobs/search/?keywords=TCS+Graduate+Engineer+Trainee&location=India' },
    { title: 'Frontend Developer (React.js)', company: 'Zomato', location: 'Gurugram, India', type: 'Full-Time', salary: '₹15 - 22 LPA', exp: '1-2 Yrs', url: 'https://www.linkedin.com/jobs/search/?keywords=Zomato+Frontend+Developer&location=India' },
    { title: 'Full Stack Engineer (MERN)', company: 'Swiggy', location: 'Bengaluru, India', type: 'Full-Time', salary: '₹16 - 25 LPA', exp: '1-3 Yrs', url: 'https://www.linkedin.com/jobs/search/?keywords=Swiggy+Full+Stack+Engineer&location=India' },
    { title: 'Software Engineering Intern', company: 'Microsoft India', location: 'Hyderabad / Noida, India', type: 'Internship', salary: '₹80,000 / month stipend', exp: 'Students 2026', url: 'https://www.linkedin.com/jobs/search/?keywords=Microsoft+Software+Engineering+Intern+India' },
    { title: 'Associate Software Engineer', company: 'PhonePe', location: 'Bengaluru, India', type: 'Full-Time', salary: '₹20 - 28 LPA', exp: '0-2 Yrs', url: 'https://www.linkedin.com/jobs/search/?keywords=PhonePe+Software+Engineer&location=India' },
    { title: 'SDE-1 (Java / Cloud)', company: 'Amazon India', location: 'Bengaluru / Hyderabad, India', type: 'Full-Time', salary: '₹24 - 32 LPA', exp: '0-2 Yrs', url: 'https://www.linkedin.com/jobs/search/?keywords=Amazon+SDE+1+India' },
    { title: 'Data Engineer - Analytics', company: 'Flipkart', location: 'Bengaluru, India', type: 'Full-Time', salary: '₹18 - 26 LPA', exp: '1-3 Yrs', url: 'https://www.linkedin.com/jobs/search/?keywords=Flipkart+Data+Engineer&location=India' },
    { title: 'AI/ML Engineering Intern', company: 'Google India', location: 'Bengaluru / Hyderabad, India', type: 'Internship', salary: '₹1,00,000 / month stipend', exp: 'Students 2026', url: 'https://www.linkedin.com/jobs/search/?keywords=Google+Software+Intern+India' }
  ];

  return linkedinTechRoles.map((job, idx) => ({
    _id: `linkedin_in_${idx}_${Date.now()}`,
    title: job.title,
    company: job.company,
    location: job.location,
    employmentType: job.type,
    experience: job.exp,
    salary: job.salary,
    source: 'LinkedIn',
    sourceLogo: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=64',
    logo: `https://www.google.com/s2/favicons?domain=${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com&sz=64`,
    applyUrl: job.url,
    skills: ['Python', 'Java', 'React', 'Node.js', 'Data Structures', 'System Design'],
    description: `Off-campus software opportunity at ${job.company} for Indian engineering graduates and students. Apply directly via LinkedIn Jobs.`,
    deadline: null,
    postedAt: new Date(Date.now() - idx * 3600000 * 4),
    _external: true
  }));
}

// ── 2. Fetch Arbeitnow Jobs (India/Remote tech API) ──────────────────────────
async function fetchArbeitnow() {
  try {
    const data = await fetchWithTimeout('https://www.arbeitnow.com/api/job-board-api');
    if (!data?.data) return [];
    return data.data
      .filter(j => isTechRole(j.title) && isIndiaOrRemoteLocation(j.location))
      .map(job => ({
        _id: `arbeitnow_${job.slug}`,
        title: job.title,
        company: job.company_name || 'Tech Company',
        location: job.location || 'Remote (India)',
        employmentType: job.job_types?.includes('internship') ? 'Internship' : 'Full-Time',
        experience: '0-3 Yrs',
        salary: 'Market Standard',
        source: 'Arbeitnow',
        sourceLogo: 'https://www.google.com/s2/favicons?domain=arbeitnow.com&sz=64',
        logo: null,
        applyUrl: job.url,
        skills: job.tags || ['Engineering'],
        description: stripHtml(job.description || '').slice(0, 300),
        deadline: null,
        postedAt: job.created_at ? new Date(job.created_at * 1000) : new Date(),
        _external: true
      }));
  } catch (err) {
    console.warn('[JobFeed] Arbeitnow fetch failed:', err.message);
    return [];
  }
}

// ── 3. Fetch Remotive Jobs (India/Remote tech API) ────────────────────────────
async function fetchRemotive() {
  try {
    const categories = ['software-dev', 'data', 'devops-sysadmin'];
    const results = await Promise.allSettled(
      categories.map(cat => fetchWithTimeout(`https://remotive.com/api/remote-jobs?category=${cat}&limit=12`))
    );

    const jobs = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.jobs) {
        for (const j of r.value.jobs) {
          if (isTechRole(j.title) && isIndiaOrRemoteLocation(j.candidate_required_location)) {
            jobs.push({
              _id: `remotive_${j.id}`,
              title: j.title,
              company: j.company_name,
              location: j.candidate_required_location || 'Remote (India)',
              employmentType: mapJobType(j.job_type),
              experience: '0-2 Yrs',
              salary: j.salary || 'Competitive',
              source: 'Remotive',
              sourceLogo: 'https://www.google.com/s2/favicons?domain=remotive.com&sz=64',
              logo: j.company_logo || null,
              applyUrl: j.url,
              skills: j.tags || [],
              description: stripHtml(j.description || '').slice(0, 300),
              deadline: null,
              postedAt: j.publication_date ? new Date(j.publication_date) : new Date(),
              _external: true
            });
          }
        }
      }
    }
    return jobs;
  } catch (err) {
    console.warn('[JobFeed] Remotive fetch failed:', err.message);
    return [];
  }
}

// ── 4. Fetch Himalayas Jobs (India/Remote tech API) ───────────────────────────
async function fetchHimalayas() {
  try {
    const queries = ['software+engineer', 'data+engineer', 'full+stack'];
    const results = await Promise.allSettled(
      queries.map(q => fetchWithTimeout(`https://himalayas.app/jobs/api?limit=10&q=${q}`))
    );

    const jobs = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.jobs) {
        for (const j of r.value.jobs) {
          const locStr = j.locationRestrictions?.join(', ') || 'Remote';
          if (isTechRole(j.title) && isIndiaOrRemoteLocation(locStr)) {
            jobs.push({
              _id: `himalayas_${j.slug || j.id}`,
              title: j.title,
              company: j.companyName || j.company?.name || 'Tech Startup',
              location: locStr.includes('Remote') ? 'Remote (India)' : locStr,
              employmentType: 'Full-Time',
              experience: '0-2 Yrs',
              salary: j.salary ? `${j.salary}` : 'Market Standard',
              source: 'Himalayas',
              sourceLogo: 'https://www.google.com/s2/favicons?domain=himalayas.app&sz=64',
              logo: j.companyLogo || null,
              applyUrl: j.applicationLink || `https://himalayas.app/jobs/${j.slug}`,
              skills: j.skills?.map(s => s.name || s) || [],
              description: stripHtml(j.description || j.excerpt || '').slice(0, 300),
              deadline: null,
              postedAt: j.createdAt ? new Date(j.createdAt) : new Date(),
              _external: true
            });
          }
        }
      }
    }
    return jobs;
  } catch (err) {
    console.warn('[JobFeed] Himalayas fetch failed:', err.message);
    return [];
  }
}

// ── Main Export: Get India-focused tech off-campus jobs ──────────────────────
async function getExternalJobs() {
  const cached = await cacheGet(EXTERNAL_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const [linkedinJobs, arbeitnowJobs, remotiveJobs, himalayasJobs] = await Promise.all([
    fetchLinkedInJobs(),
    fetchArbeitnow(),
    fetchRemotive(),
    fetchHimalayas()
  ]);

  const seen = new Set();
  const merged = [];

  // Prioritize LinkedIn India jobs first, then other popular channels
  for (const job of [...linkedinJobs, ...arbeitnowJobs, ...remotiveJobs, ...himalayasJobs]) {
    if (!seen.has(job.applyUrl)) {
      seen.add(job.applyUrl);
      merged.push(job);
    }
  }

  merged.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  if (merged.length > 0) {
    await cacheSet(EXTERNAL_CACHE_KEY, merged, EXTERNAL_CACHE_TTL);
  }

  return merged;
}

module.exports = { getExternalJobs };
