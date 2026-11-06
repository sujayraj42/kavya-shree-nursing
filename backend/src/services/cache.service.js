'use strict';

let Redis = null;
try {
  Redis = require('ioredis');
} catch {
  // If ioredis is not present, in-memory cache is used exclusively
}

class CacheService {
  constructor() {
    this.redisClient = null;
    this.isRedisReady = false;
    this.memoryCache = new Map();
    this.maxMemoryEntries = 1000;

    this.initRedis();

    // Clean up expired in-memory keys every 60s
    this.cleanupTimer = setInterval(() => this.purgeExpiredMemory(), 60000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  initRedis() {
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (!Redis || !redisUrl) {
      return;
    }

    try {
      this.redisClient = new Redis(redisUrl, {
        lazyConnect: false,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
        retryStrategy: () => null // Do not hang indefinitely if Redis goes down
      });

      this.redisClient.on('connect', () => {
        this.isRedisReady = true;
      });

      this.redisClient.on('error', (err) => {
        this.isRedisReady = false;
      });
    } catch {
      this.isRedisReady = false;
    }
  }

  async get(key) {
    if (this.isRedisReady && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw !== null) {
          return JSON.parse(raw);
        }
      } catch {
        // Fallback to memory
      }
    }

    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key, value, ttlSeconds = 300) {
    const ttlMs = Math.max(1, ttlSeconds) * 1000;

    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch {
        // Fallback to memory
      }
    }

    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  async del(key) {
    this.memoryCache.delete(key);
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {
        // Silently continue
      }
    }
  }

  async delPattern(pattern) {
    // In-memory pattern deletion
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    if (this.isRedisReady && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } catch {
        // Silently continue
      }
    }
  }

  async flush() {
    this.memoryCache.clear();
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch {
        // Silently continue
      }
    }
  }

  purgeExpiredMemory() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }

  isRedisConnected() {
    return this.isRedisReady;
  }

  // Domain helpers
  async invalidateContent() {
    await this.delPattern('content:*');
  }

  async invalidateStats() {
    await this.delPattern('stats:*');
  }

  async invalidateAdminSession(adminId) {
    if (adminId) {
      await this.del(`admin:session:${adminId}`);
    }
  }
}

const cacheService = new CacheService();

module.exports = {
  cacheService,
  CacheService
};

