const NodeCache = require('node-cache');

// TTL: 5 minutes default, check period: 60s
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300,
  checkperiod: 60,
  useClones: false, // Better performance — don't clone objects
});

/**
 * Generic cache wrapper for async functions
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute on cache miss
 * @param {number} ttl - Optional TTL override (seconds)
 */
const withCache = async (key, fn, ttl = null) => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return { data: cached, fromCache: true };
  }

  const data = await fn();

  if (ttl !== null) {
    cache.set(key, data, ttl);
  } else {
    cache.set(key, data);
  }

  return { data, fromCache: false };
};

/**
 * Invalidate cache entries matching a prefix
 */
const invalidatePrefix = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  cache.del(keys);
  return keys.length;
};

const getStats = () => cache.getStats();

module.exports = { cache, withCache, invalidatePrefix, getStats };