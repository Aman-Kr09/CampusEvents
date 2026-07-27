const rateLimit = require('express-rate-limit');

// Attempt to use Redis store; fall back to in-memory if Redis is unavailable
let RedisStore;
try {
  RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
} catch {
  RedisStore = null;
}

/**
 * Factory: create a rate limiter middleware.
 * Automatically uses Redis backing if the redis client is connected.
 *
 * @param {{ windowMs: number, max: number, message: string }} opts
 * @param {import('ioredis').Redis} redisClient
 */
const createLimiter = (opts, redisClient) => {
  const baseOptions = {
    windowMs: opts.windowMs || 15 * 60 * 1000,
    max: opts.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: opts.message || 'Too many requests, please try again later.' },
    // Skip rate limiting if request comes from localhost during development
    skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1'
  };

  if (RedisStore && redisClient && redisClient.status === 'ready') {
    try {
      baseOptions.store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
      });
    } catch {
      // Fall through to in-memory
    }
  }

  return rateLimit(baseOptions);
};

module.exports = { createLimiter };
