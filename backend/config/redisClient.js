const Redis = require('ioredis');

// ─── Redis Connection Configuration ───────────────────────────────────────────
// Supports:
// 1. REDIS_URL (e.g. rediss://default:password@xxx.upstash.io:6379)
// 2. REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TLS env vars
// 3. Defaults to 127.0.0.1:6379 (Local Redis)

const getRedisOptions = (isBull = false) => {
  const redisUrl = process.env.REDIS_URL;
  const isTls = process.env.REDIS_TLS === 'true' || (redisUrl && redisUrl.startsWith('rediss://'));
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  const baseOptions = {
    // KeepAlive ping every 5s to prevent Upstash / Cloud Redis idle TCP disconnects (ECONNRESET)
    keepAlive: 5000,
    // Reconnect strategy: back-off up to 3 seconds, keep retrying in background
    retryStrategy: (times) => {
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
    // Auto reconnect on unexpected errors like ECONNRESET
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError) || err.message.includes('ECONNRESET')) {
        return true; // Reconnect automatically
      }
      return 1;
    },
    // Enable offline queue so commands wait briefly for reconnect instead of failing instantly
    enableOfflineQueue: true,
    lazyConnect: true
  };

  if (isBull) {
    // BullMQ requires maxRetriesPerRequest: null
    baseOptions.maxRetriesPerRequest = null;
  }

  // Handle TLS for Upstash / Redis Cloud
  if (isTls) {
    baseOptions.tls = { rejectUnauthorized: false };
  }

  if (redisUrl) {
    return [redisUrl, baseOptions];
  }

  return [{
    host,
    port,
    password,
    ...baseOptions
  }];
};

// Create main Redis client
const createClient = (isBull = false) => {
  const args = getRedisOptions(isBull);
  if (typeof args[0] === 'string') {
    return new Redis(args[0], args[1]);
  }
  return new Redis(args[0]);
};

const redis = createClient(false);
const bullConnection = createClient(true);

redis.on('connect', () => console.log('✅ Redis: connected'));
redis.on('ready', () => console.log('✅ Redis: ready for commands'));
redis.on('reconnecting', (time) => console.log(`🔄 Redis: reconnecting in ${time}ms…`));
redis.on('error', (err) => {
  // Suppress verbose ECONNREFUSED when local Redis is not installed
  if (err.code === 'ECONNREFUSED') {
    // Quiet handling for dev without local Redis
  } else {
    console.warn(`⚠️  Redis alert: ${err.message}`);
  }
});

// Lazy connect on boot
redis.connect().catch(() => {
  console.warn('⚠️  Redis: Initial connection pending (caching will activate when Redis is ready)');
});
bullConnection.connect().catch(() => {});

// ─── Safe Caching Helpers (guards against disconnected state) ───────────────

const cacheGet = async (key) => {
  if (redis.status !== 'ready') return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (key, value, ttlSec = 300) => {
  if (redis.status !== 'ready') return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  } catch {
    // Ignore cache set failures
  }
};

const cacheDel = async (...keys) => {
  if (redis.status !== 'ready') return;
  try {
    if (keys.length === 0) return;
    await redis.del(...keys);
  } catch {
    // Ignore cache del failures
  }
};

const cacheDelPattern = async (pattern) => {
  if (redis.status !== 'ready') return;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    // Ignore scan failure
  }
};

module.exports = { redis, bullConnection, cacheGet, cacheSet, cacheDel, cacheDelPattern };
