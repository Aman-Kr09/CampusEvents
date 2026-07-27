const { redis } = require('../config/redisClient');
const Event = require('../models/Event');

// ─── Redis-backed metrics buffer ──────────────────────────────────────────────
// Accumulates view counts in Redis hash maps and flushes to MongoDB every 60s.

const FLUSH_INTERVAL_MS = 60_000; // flush every 60 s
let flushTimer = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Increment view count for an event in Redis.
 * Falls back to direct MongoDB update if Redis is unavailable.
 */
const incrementView = async (eventId) => {
  if (redis.status === 'ready') {
    try {
      await redis.hincrby('buffered_views', String(eventId), 1);
      return;
    } catch {
      // Fall through to MongoDB on error
    }
  }
  // Fallback: direct MongoDB update
  try {
    await Event.findByIdAndUpdate(eventId, { $inc: { views: 1 } });
  } catch (err) {
    console.error('❌ [MetricsBuffer] Direct Mongo view increment error:', err.message);
  }
};

/**
 * Apply a like-delta (+1 or -1) for an event in Redis.
 * Falls back to direct MongoDB update if Redis is unavailable.
 */
const bufferLikeDelta = async (eventId, delta) => {
  if (redis.status === 'ready') {
    try {
      await redis.hincrby('buffered_likes', String(eventId), delta);
      return;
    } catch {
      // Fall through to MongoDB on error
    }
  }
};

// ─── Flush helpers ────────────────────────────────────────────────────────────

const flushViewsToDB = async () => {
  if (redis.status !== 'ready') return;
  try {
    const data = await redis.hgetall('buffered_views');
    if (!data || Object.keys(data).length === 0) return;

    // Atomically clear the hash before writing so we don't double-count
    const pipeline = redis.pipeline();
    Object.keys(data).forEach((id) => pipeline.hdel('buffered_views', id));
    await pipeline.exec();

    const bulkOps = Object.entries(data).map(([id, count]) => ({
      updateOne: {
        filter: { _id: id },
        update: { $inc: { views: parseInt(count, 10) } }
      }
    }));

    if (bulkOps.length) {
      await Event.bulkWrite(bulkOps, { ordered: false });
      console.log(`📊 [MetricsBuffer] Flushed views for ${bulkOps.length} event(s) to MongoDB`);
    }
  } catch (err) {
    console.error('❌ [MetricsBuffer] flushViewsToDB error:', err.message);
  }
};

const flushLikesToDB = async () => {
  if (redis.status !== 'ready') return;
  try {
    const data = await redis.hgetall('buffered_likes');
    if (!data || Object.keys(data).length === 0) return;

    const pipeline = redis.pipeline();
    Object.keys(data).forEach((id) => pipeline.hdel('buffered_likes', id));
    await pipeline.exec();
  } catch (err) {
    console.error('❌ [MetricsBuffer] flushLikesToDB error:', err.message);
  }
};

/**
 * Flush all buffered metrics to MongoDB immediately.
 */
const flushAll = async () => {
  if (redis.status !== 'ready') return;
  await Promise.all([flushViewsToDB(), flushLikesToDB()]);
};

/**
 * Start the background flush timer. Safe to call multiple times.
 */
const startFlushTimer = () => {
  if (flushTimer) return;
  flushTimer = setInterval(async () => {
    await flushAll();
  }, FLUSH_INTERVAL_MS);

  if (flushTimer.unref) flushTimer.unref();

  console.log(`✅ [MetricsBuffer] Flush timer started (every ${FLUSH_INTERVAL_MS / 1000}s)`);
};

/**
 * Stop the flush timer and perform a final flush.
 */
const stopFlushTimer = async () => {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  await flushAll();
  console.log('✅ [MetricsBuffer] Timer stopped and final flush completed');
};

module.exports = { incrementView, bufferLikeDelta, flushAll, startFlushTimer, stopFlushTimer };
