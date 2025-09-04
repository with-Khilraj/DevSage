/**
 * Cache Service
 * Redis-based caching for code analysis results and other data
 */

const redis = require('redis');
const crypto = require('crypto');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 5 * 60; // 5 minutes in seconds
    this.init();
  }

  async init() {
    try {
      // Skip Redis initialization if not available
      if (!process.env.REDIS_HOST && !process.env.REDIS_ENABLED) {
        console.log('Redis not configured, running without cache');
        this.isConnected = false;
        return;
      }

      // Create Redis client
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log('Redis retry attempts exhausted');
              return false;
            }
            return Math.min(retries * 100, 1000);
          }
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: process.env.REDIS_DB || 0
      });

      // Handle connection events
      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.warn('Redis client error (continuing without cache):', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      // Connect to Redis with timeout
      const connectTimeout = setTimeout(() => {
        console.log('Redis connection timeout, continuing without cache');
        this.isConnected = false;
      }, 5000);

      try {
        await this.client.connect();
        clearTimeout(connectTimeout);
      } catch (connectError) {
        clearTimeout(connectTimeout);
        throw connectError;
      }
    } catch (error) {
      console.warn('Redis cache not available, continuing without cache:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key for code analysis
   * @param {string} codeContent - Code content
   * @param {string} filePath - File path
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {string} Cache key
   */
  generateAnalysisCacheKey(codeContent, filePath, userId, options = {}) {
    const content = codeContent + filePath + userId + JSON.stringify(options);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return `analysis:${hash}`;
  }

  /**
   * Cache code analysis result
   * @param {string} codeContent - Code content
   * @param {string} filePath - File path
   * @param {string} userId - User ID
   * @param {Object} analysisResult - Analysis result to cache
   * @param {Object} options - Analysis options
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async cacheAnalysisResult(codeContent, filePath, userId, analysisResult, options = {}, ttl = null) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache');
      return false;
    }

    try {
      const key = this.generateAnalysisCacheKey(codeContent, filePath, userId, options);
      const value = JSON.stringify({
        ...analysisResult,
        cachedAt: new Date().toISOString(),
        filePath,
        userId
      });

      await this.client.setEx(key, ttl || this.defaultTTL, value);
      console.log(`Cached analysis result for key: ${key}`);
      return true;
    } catch (error) {
      console.error('Failed to cache analysis result:', error);
      return false;
    }
  }

  /**
   * Get cached code analysis result
   * @param {string} codeContent - Code content
   * @param {string} filePath - File path
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object|null>} Cached result or null
   */
  async getCachedAnalysisResult(codeContent, filePath, userId, options = {}) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const key = this.generateAnalysisCacheKey(codeContent, filePath, userId, options);
      const cached = await this.client.get(key);
      
      if (cached) {
        const result = JSON.parse(cached);
        console.log(`Cache hit for analysis key: ${key}`);
        return {
          ...result,
          fromCache: true
        };
      }
      
      console.log(`Cache miss for analysis key: ${key}`);
      return null;
    } catch (error) {
      console.error('Failed to get cached analysis result:', error);
      return null;
    }
  }

  /**
   * Cache user statistics
   * @param {string} userId - User ID
   * @param {string} period - Time period
   * @param {Object} stats - Statistics to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserStats(userId, period, stats, ttl = 60 * 60) { // 1 hour default
    if (!this.isConnected) {
      return false;
    }

    try {
      const key = `stats:user:${userId}:${period}`;
      const value = JSON.stringify({
        ...stats,
        cachedAt: new Date().toISOString()
      });

      await this.client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      console.error('Failed to cache user stats:', error);
      return false;
    }
  }

  /**
   * Get cached user statistics
   * @param {string} userId - User ID
   * @param {string} period - Time period
   * @returns {Promise<Object|null>} Cached stats or null
   */
  async getCachedUserStats(userId, period) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const key = `stats:user:${userId}:${period}`;
      const cached = await this.client.get(key);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached user stats:', error);
      return null;
    }
  }

  /**
   * Cache team analytics
   * @param {string} teamId - Team ID
   * @param {string} period - Time period
   * @param {Object} analytics - Analytics to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async cacheTeamAnalytics(teamId, period, analytics, ttl = 30 * 60) { // 30 minutes default
    if (!this.isConnected) {
      return false;
    }

    try {
      const key = `analytics:team:${teamId}:${period}`;
      const value = JSON.stringify({
        ...analytics,
        cachedAt: new Date().toISOString()
      });

      await this.client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      console.error('Failed to cache team analytics:', error);
      return false;
    }
  }

  /**
   * Get cached team analytics
   * @param {string} teamId - Team ID
   * @param {string} period - Time period
   * @returns {Promise<Object|null>} Cached analytics or null
   */
  async getCachedTeamAnalytics(teamId, period) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const key = `analytics:team:${teamId}:${period}`;
      const cached = await this.client.get(key);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached team analytics:', error);
      return null;
    }
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Cache key pattern
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateByPattern(pattern) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.client.del(keys);
        console.log(`Invalidated ${deleted} cache entries matching pattern: ${pattern}`);
        return deleted;
      }
      return 0;
    } catch (error) {
      console.error('Failed to invalidate cache by pattern:', error);
      return 0;
    }
  }

  /**
   * Invalidate user's analysis cache
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateUserAnalysisCache(userId) {
    return this.invalidateByPattern(`analysis:*:${userId}:*`);
  }

  /**
   * Invalidate user's stats cache
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateUserStatsCache(userId) {
    return this.invalidateByPattern(`stats:user:${userId}:*`);
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: true,
        memory: info,
        keyspace: keyspace,
        isConnected: this.isConnected
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      console.log('All cache cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Check if cache is available
   * @returns {boolean} Availability status
   */
  isAvailable() {
    return this.isConnected;
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;