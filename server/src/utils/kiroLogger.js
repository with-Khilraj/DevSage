/**
 * Kiro AI Logger
 * Comprehensive logging system for AI interactions, performance monitoring, and debugging
 */

const fs = require('fs').promises;
const path = require('path');

class KiroLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'kiro');
    this.maxLogSize = 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = 5;
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLogLevel = process.env.LOG_LEVEL || 'INFO';
    this.initializeLogDirectory();
  }

  /**
   * Initialize log directory
   */
  async initializeLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Log AI interaction
   * @param {string} service - Service name (e.g., 'kiro-analysis', 'kiro-multimodal')
   * @param {string} operation - Operation type (e.g., 'analyze', 'generate')
   * @param {Object} input - Input data (sanitized)
   * @param {Object} output - Output data
   * @param {number} duration - Operation duration in ms
   * @param {Object} metadata - Additional metadata
   */
  async logInteraction(service, operation, input, output, duration, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service,
      operation,
      duration,
      success: !output.error,
      input: this.sanitizeInput(input),
      output: this.sanitizeOutput(output),
      metadata: {
        ...metadata,
        userId: metadata.userId || 'anonymous',
        sessionId: metadata.sessionId,
        requestId: metadata.requestId
      },
      performance: {
        duration,
        inputSize: this.calculateSize(input),
        outputSize: this.calculateSize(output),
        cacheHit: output.fromCache || false
      }
    };

    await this.writeLog('interactions', logEntry);
    
    // Log performance metrics separately for analysis
    await this.logPerformance(service, operation, duration, logEntry.performance);
  }

  /**
   * Log error with context
   * @param {string} service - Service name
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  async logError(service, error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        status: error.status || error.statusCode
      },
      context: this.sanitizeContext(context),
      metadata: {
        userId: context.userId,
        sessionId: context.sessionId,
        requestId: context.requestId,
        userAgent: context.userAgent,
        ip: context.ip
      }
    };

    await this.writeLog('errors', logEntry);
    
    // Also log to console for immediate visibility
    console.error(`[${service}] ${error.message}`, {
      context: logEntry.context,
      stack: error.stack
    });
  }

  /**
   * Log performance metrics
   * @param {string} service - Service name
   * @param {string} operation - Operation type
   * @param {number} duration - Duration in ms
   * @param {Object} metrics - Additional metrics
   */
  async logPerformance(service, operation, duration, metrics = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service,
      operation,
      duration,
      metrics: {
        ...metrics,
        slow: duration > 5000, // Mark as slow if > 5 seconds
        fast: duration < 100,   // Mark as fast if < 100ms
      }
    };

    await this.writeLog('performance', logEntry);
  }

  /**
   * Log user feedback
   * @param {string} suggestionId - Suggestion ID
   * @param {string} feedback - Feedback type
   * @param {string} comment - User comment
   * @param {Object} context - Feedback context
   */
  async logFeedback(suggestionId, feedback, comment, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      suggestionId,
      feedback,
      comment,
      context: this.sanitizeContext(context),
      metadata: {
        userId: context.userId,
        service: context.service,
        operation: context.operation
      }
    };

    await this.writeLog('feedback', logEntry);
  }

  /**
   * Log cache operations
   * @param {string} operation - Cache operation (hit, miss, set, clear)
   * @param {string} service - Service name
   * @param {string} key - Cache key
   * @param {Object} metadata - Additional metadata
   */
  async logCache(operation, service, key, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      service,
      key: this.hashKey(key), // Hash key for privacy
      metadata
    };

    await this.writeLog('cache', logEntry);
  }

  /**
   * Log security events
   * @param {string} event - Security event type
   * @param {string} severity - Severity level
   * @param {Object} details - Event details
   * @param {Object} context - Security context
   */
  async logSecurity(event, severity, details, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      event,
      severity,
      details: this.sanitizeSecurityDetails(details),
      context: this.sanitizeContext(context),
      metadata: {
        userId: context.userId,
        ip: context.ip,
        userAgent: context.userAgent
      }
    };

    await this.writeLog('security', logEntry);
    
    // Security events should also go to console immediately
    console.warn(`[SECURITY] ${event} - ${severity}`, logEntry);
  }

  /**
   * Write log entry to file
   * @param {string} logType - Type of log (interactions, errors, performance, etc.)
   * @param {Object} logEntry - Log entry object
   */
  async writeLog(logType, logEntry) {
    try {
      const logFile = path.join(this.logDir, `${logType}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Check if log rotation is needed
      await this.rotateLogIfNeeded(logFile);
      
      // Append to log file
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error(`Failed to write ${logType} log:`, error);
    }
  }

  /**
   * Rotate log file if it exceeds max size
   * @param {string} logFile - Log file path
   */
  async rotateLogIfNeeded(logFile) {
    try {
      const stats = await fs.stat(logFile);
      
      if (stats.size > this.maxLogSize) {
        // Rotate logs
        for (let i = this.maxLogFiles - 1; i > 0; i--) {
          const oldFile = `${logFile}.${i}`;
          const newFile = `${logFile}.${i + 1}`;
          
          try {
            await fs.rename(oldFile, newFile);
          } catch (error) {
            // File might not exist, which is fine
          }
        }
        
        // Move current log to .1
        await fs.rename(logFile, `${logFile}.1`);
      }
    } catch (error) {
      // File might not exist yet, which is fine
    }
  }

  /**
   * Sanitize input data to remove sensitive information
   * @param {Object} input - Input data
   * @returns {Object} Sanitized input
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'object') {
      return input;
    }

    const sanitized = { ...input };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Truncate large code content for logging
    if (sanitized.codeContent && sanitized.codeContent.length > 1000) {
      sanitized.codeContent = sanitized.codeContent.substring(0, 1000) + '... [TRUNCATED]';
    }
    
    return sanitized;
  }

  /**
   * Sanitize output data
   * @param {Object} output - Output data
   * @returns {Object} Sanitized output
   */
  sanitizeOutput(output) {
    if (!output || typeof output !== 'object') {
      return output;
    }

    const sanitized = { ...output };
    
    // Remove stack traces from output logs (keep in error logs)
    if (sanitized.stack) {
      delete sanitized.stack;
    }
    
    return sanitized;
  }

  /**
   * Sanitize context data
   * @param {Object} context - Context data
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const sanitized = { ...context };
    
    // Remove sensitive context fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.authorization;
    
    // Mask IP addresses partially
    if (sanitized.ip) {
      const parts = sanitized.ip.split('.');
      if (parts.length === 4) {
        sanitized.ip = `${parts[0]}.${parts[1]}.xxx.xxx`;
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize security event details
   * @param {Object} details - Security details
   * @returns {Object} Sanitized details
   */
  sanitizeSecurityDetails(details) {
    const sanitized = this.sanitizeContext(details);
    
    // Additional security-specific sanitization
    if (sanitized.payload && typeof sanitized.payload === 'string' && sanitized.payload.length > 500) {
      sanitized.payload = sanitized.payload.substring(0, 500) + '... [TRUNCATED]';
    }
    
    return sanitized;
  }

  /**
   * Calculate approximate size of data
   * @param {any} data - Data to measure
   * @returns {number} Size in bytes
   */
  calculateSize(data) {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Hash a key for privacy
   * @param {string} key - Key to hash
   * @returns {string} Hashed key
   */
  hashKey(key) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Get log statistics
   * @param {string} logType - Type of log
   * @param {number} hours - Hours to look back (default 24)
   * @returns {Promise<Object>} Log statistics
   */
  async getLogStats(logType, hours = 24) {
    try {
      const logFile = path.join(this.logDir, `${logType}.log`);
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recentEntries = lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(entry => entry && new Date(entry.timestamp) > cutoffTime);
      
      return {
        totalEntries: recentEntries.length,
        timeRange: `${hours} hours`,
        oldestEntry: recentEntries.length > 0 ? recentEntries[0].timestamp : null,
        newestEntry: recentEntries.length > 0 ? recentEntries[recentEntries.length - 1].timestamp : null,
        entries: recentEntries
      };
    } catch (error) {
      return {
        totalEntries: 0,
        error: error.message
      };
    }
  }

  /**
   * Get performance analytics
   * @param {string} service - Service name (optional)
   * @param {number} hours - Hours to analyze (default 24)
   * @returns {Promise<Object>} Performance analytics
   */
  async getPerformanceAnalytics(service = null, hours = 24) {
    try {
      const stats = await this.getLogStats('performance', hours);
      const entries = stats.entries || [];
      
      let filteredEntries = entries;
      if (service) {
        filteredEntries = entries.filter(entry => entry.service === service);
      }
      
      if (filteredEntries.length === 0) {
        return { message: 'No performance data available' };
      }
      
      const durations = filteredEntries.map(entry => entry.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      // Calculate percentiles
      const sortedDurations = durations.sort((a, b) => a - b);
      const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)];
      const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
      const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];
      
      return {
        service: service || 'all',
        timeRange: `${hours} hours`,
        totalRequests: filteredEntries.length,
        averageDuration: Math.round(avgDuration),
        minDuration,
        maxDuration,
        percentiles: {
          p50: Math.round(p50),
          p95: Math.round(p95),
          p99: Math.round(p99)
        },
        slowRequests: filteredEntries.filter(entry => entry.metrics?.slow).length,
        fastRequests: filteredEntries.filter(entry => entry.metrics?.fast).length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Clean old logs
   * @param {number} days - Days to keep (default 30)
   */
  async cleanOldLogs(days = 30) {
    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const logTypes = ['interactions', 'errors', 'performance', 'feedback', 'cache', 'security'];
      
      for (const logType of logTypes) {
        const logFile = path.join(this.logDir, `${logType}.log`);
        
        try {
          const content = await fs.readFile(logFile, 'utf8');
          const lines = content.trim().split('\n');
          
          const recentLines = lines.filter(line => {
            try {
              const entry = JSON.parse(line);
              return new Date(entry.timestamp) > cutoffTime;
            } catch {
              return false;
            }
          });
          
          await fs.writeFile(logFile, recentLines.join('\n') + '\n');
        } catch (error) {
          // Log file might not exist, which is fine
        }
      }
      
      console.log(`Cleaned logs older than ${days} days`);
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }
}

// Create and export singleton instance
const kiroLogger = new KiroLogger();

module.exports = kiroLogger;