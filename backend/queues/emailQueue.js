const { Queue, Worker, QueueEvents } = require('bullmq');
const { bullConnection } = require('../config/redisClient');
const sendEmail = require('../config/mailer');

// ─── Email Queue ──────────────────────────────────────────────────────────────
// Jobs are produced by authController and consumed by the worker below.
// If Redis is down, the worker never starts but the HTTP response is unaffected.

let emailQueue = null;
let emailQueueEvents = null;

try {
  emailQueue = new Queue('email-queue', {
    connection: bullConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }, // 5s, 10s, 20s
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 }
    }
  });

  // Worker: processes one email job at a time
  const emailWorker = new Worker(
    'email-queue',
    async (job) => {
      const { email, subject, message, html } = job.data;
      console.log(`📧 [EmailQueue] Processing job #${job.id} → ${email}`);
      await sendEmail({ email, subject, message, html });
      console.log(`✅ [EmailQueue] Job #${job.id} completed`);
    },
    {
      connection: bullConnection,
      concurrency: 5,        // Up to 5 concurrent email sends
      limiter: { max: 20, duration: 60_000 } // Max 20 emails/min
    }
  );

  emailWorker.on('failed', (job, err) => {
    console.error(`❌ [EmailQueue] Job #${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  emailQueueEvents = new QueueEvents('email-queue', { connection: bullConnection });

  console.log('✅ Email Queue and Worker initialised');
} catch (err) {
  console.warn('⚠️  Email Queue disabled (Redis unavailable):', err.message);
}

/**
 * Enqueue an email job.  Falls back to synchronous delivery if queue is down.
 */
const enqueueEmail = async (emailPayload) => {
  if (emailQueue) {
    try {
      await emailQueue.add('send-email', emailPayload, { priority: 1 });
      return { queued: true };
    } catch (err) {
      console.warn('⚠️  Queue push failed, falling back to sync email:', err.message);
    }
  }
  // Synchronous fallback — does not block request since we don't await the result
  sendEmail(emailPayload).catch((e) => console.error('Sync email fallback error:', e.message));
  return { queued: false };
};

module.exports = { emailQueue, emailQueueEvents, enqueueEmail };
