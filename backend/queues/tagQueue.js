const { Queue, Worker } = require('bullmq');
const { bullConnection } = require('../config/redisClient');
const { generateTags: generateTagsSync } = require('../recommendation/recommendService');

// ─── Tag Generation Queue ─────────────────────────────────────────────────────
// Runs the Python generate_tags.py script in the background so the HTTP
// response for event creation or the /generate-tags endpoint is instant.
// The socket.io instance is injected at boot-time via setSocketInstance().

let tagQueue = null;
let _io = null;

const setSocketInstance = (io) => { _io = io; };

try {
  tagQueue = new Queue('tag-queue', {
    connection: bullConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
      removeOnComplete: { count: 30 },
      removeOnFail: { count: 50 }
    }
  });

  const tagWorker = new Worker(
    'tag-queue',
    async (job) => {
      const { description, eventId, userId } = job.data;
      console.log(`🏷️  [TagQueue] Generating tags for event ${eventId || 'preview'}…`);

      const tags = await generateTagsSync(description);
      console.log(`✅ [TagQueue] Tags generated: [${tags.join(', ')}]`);

      // Optionally push tags back to the requesting client via socket
      if (_io && userId) {
        _io.to(`user:${userId}`).emit('tags_generated', { eventId, tags });
      }

      return tags;
    },
    { connection: bullConnection, concurrency: 2 }
  );

  tagWorker.on('failed', (job, err) => {
    console.error(`❌ [TagQueue] Job #${job?.id} failed: ${err.message}`);
  });

  console.log('✅ Tag Generation Queue and Worker initialised');
} catch (err) {
  console.warn('⚠️  Tag Queue disabled (Redis unavailable):', err.message);
}

/**
 * Enqueue a tag-generation job. Falls back to sync generation if queue is down.
 * @returns {Promise<string[]>} tags array (sync only if queue is unavailable)
 */
const enqueueTagGeneration = async ({ description, eventId, userId }) => {
  if (tagQueue) {
    try {
      await tagQueue.add('generate-tags', { description, eventId, userId });
      return null; // Tags will arrive via WebSocket event 'tags_generated'
    } catch (err) {
      console.warn('⚠️  Tag queue push failed, falling back to sync generation:', err.message);
    }
  }
  // Sync fallback — runs Python immediately in this request cycle
  return generateTagsSync(description);
};

module.exports = { tagQueue, enqueueTagGeneration, setSocketInstance };
