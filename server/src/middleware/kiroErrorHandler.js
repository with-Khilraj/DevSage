/**
 * Kiro AI Error Handler Middleware
 * Handles errors from Kiro AI services with proper fallbacks and logging
 */

class KiroErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.circuitBreaker = new Map();
    this.maxErrors = 5;
    this.resetTimeout = 60000; // 1 minute
  }

  /**
   * Express middleware for handling Kiro AI errors
   */
  middleware() {
    return (error, req, res, next) => {
      // Check if this is a Kiro AI related error
      if (this.isKiroError(error)) {
        return this.handleKiroError(error, req, res, next);
      }
      
      // Pass non-Kiro errors to next handler
      next(error);
    };
  }

  /**
   * Handle Kiro AI specific errors
   */
  handleKiroError(error, req, res, next) {
    const service = this.extractServiceName(error);
    const errorType = this.classifyError(error);
    
    // Log the error
    this.logError(error, req, service, errorType);
    
    // Update error tracking
    this.trackError(service);
    
    // Check circuit breaker
    if (this.isCircuitOpen(service)) {
      return this.sendFallbackResponse(req, res, service, 'Circuit breaker open');
    }
    
    // Handle different error types
    switch (errorType) {
      case 'RATE_LIMIT':
        return this.handleRateLimit(error, req, res, service);
      
      case 'TIMEOUT':
        return this.handleTimeout(error, req, res, service);
      
      case 'SERVICE_UNAVAILABLE':
        return this.handleServiceUnavailable(error, req, res, service);
      
      case 'AUTHENTICATION':
        return this.handleAuthError(error, req, res, service);
      
      case 'VALIDATION':
        return this.handleValidationError(error, req, res, service);
      
      default:
        return this.handleGenericError(error, req, res, service);
    }
  }

  /**
   * Check if error is from Kiro AI services
   */
  isKiroError(error) {
    return error.source === 'kiro' || 
           error.message?.includes('Kiro') ||
           error.service?.startsWith('kiro') ||
           error.stack?.includes('kiroAIService');
  }

  /**
   * Extract service name from error
   */
  extractServiceName(error) {
    if (error.service) return error.service;
    if (error.message?.includes('multimodal')) return 'kiro-multimodal';
    if (error.message?.includes('code analysis')) return 'kiro-analysis';
    if (error.message?.includes('commit')) return 'kiro-commit';
    if (error.message?.includes('PR')) return 'kiro-pr';
    if (error.message?.includes('team')) return 'kiro-team';
    return 'kiro-general';
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.statusCode;
    
    if (status === 429 || message.includes('rate limit')) {
      return 'RATE_LIMIT';
    }
    
    if (status === 408 || message.includes('timeout')) {
      return 'TIMEOUT';
    }
    
    if (status === 503 || message.includes('unavailable')) {
      return 'SERVICE_UNAVAILABLE';
    }
    
    if (status === 401 || status === 403 || message.includes('auth')) {
      return 'AUTHENTICATION';
    }
    
    if (status === 400 || message.includes('validation')) {
      return 'VALIDATION';
    }
    
    return 'GENERIC';
  }

  /**
   * Log error with context
   */
  logError(error, req, service, errorType) {
    const logData = {
      timestamp: new Date().toISOString(),
      service,
      errorType,
      message: error.message,
      status: error.status || error.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      stack: error.stack
    };
    
    console.error('Kiro AI Error:', JSON.stringify(logData, null, 2));
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logData);
    }
  }

  /**
   * Track errors for circuit breaker
   */
  trackError(service) {
    const now = Date.now();
    const errors = this.errorCounts.get(service) || [];
    
    // Add current error
    errors.push(now);
    
    // Remove errors older than reset timeout
    const recentErrors = errors.filter(time => now - time < this.resetTimeout);
    
    this.errorCounts.set(service, recentErrors);
    
    // Open circuit breaker if too many errors
    if (recentErrors.length >= this.maxErrors) {
      this.circuitBreaker.set(service, {
        isOpen: true,
        openedAt: now
      });
      
      console.warn(`Circuit breaker opened for ${service} due to ${recentErrors.length} errors`);
    }
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitOpen(service) {
    const breaker = this.circuitBreaker.get(service);
    
    if (!breaker || !breaker.isOpen) {
      return false;
    }
    
    // Check if enough time has passed to reset
    const now = Date.now();
    if (now - breaker.openedAt > this.resetTimeout) {
      this.circuitBreaker.delete(service);
      this.errorCounts.delete(service);
      console.info(`Circuit breaker reset for ${service}`);
      return false;
    }
    
    return true;
  }

  /**
   * Handle rate limit errors
   */
  handleRateLimit(error, req, res, service) {
    const retryAfter = error.retryAfter || 60;
    
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      service,
      retryAfter,
      fallback: this.getFallbackData(req, service),
      message: `Too many requests to ${service}. Please try again in ${retryAfter} seconds.`
    });
  }

  /**
   * Handle timeout errors
   */
  handleTimeout(error, req, res, service) {
    res.status(408).json({
      success: false,
      error: 'Request timeout',
      service,
      fallback: this.getFallbackData(req, service),
      message: `${service} request timed out. Using fallback response.`
    });
  }

  /**
   * Handle service unavailable errors
   */
  handleServiceUnavailable(error, req, res, service) {
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      service,
      fallback: this.getFallbackData(req, service),
      message: `${service} is temporarily unavailable. Using fallback response.`
    });
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error, req, res, service) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      service,
      message: `Authentication failed for ${service}. Please check your credentials.`
    });
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error, req, res, service) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      service,
      details: error.details || error.message,
      message: `Invalid input for ${service}.`
    });
  }

  /**
   * Handle generic errors
   */
  handleGenericError(error, req, res, service) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      service,
      fallback: this.getFallbackData(req, service),
      message: `An error occurred with ${service}. Using fallback response.`
    });
  }

  /**
   * Send fallback response when circuit breaker is open
   */
  sendFallbackResponse(req, res, service, reason) {
    res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      service,
      reason,
      fallback: this.getFallbackData(req, service),
      message: `${service} is temporarily unavailable due to ${reason}. Using fallback response.`
    });
  }

  /**
   * Get fallback data based on service and request
   */
  getFallbackData(req, service) {
    const path = req.path;
    
    if (path.includes('/analyze')) {
      return {
        qualityScore: 70,
        suggestions: [
          {
            type: 'maintainability',
            severity: 'medium',
            description: 'Consider adding comments for better code documentation',
            suggestedFix: 'Add JSDoc comments to functions',
            confidence: 0.6,
            fallback: true
          }
        ],
        patterns: [],
        securityIssues: [],
        kiroAnalyzed: false,
        fallback: true
      };
    }
    
    if (path.includes('/generate/commit')) {
      return {
        title: 'Update code',
        body: 'Code changes made',
        type: 'chore',
        scope: '',
        confidence: 0.5,
        kiroGenerated: false,
        fallback: true
      };
    }
    
    if (path.includes('/generate/pr')) {
      return {
        title: 'Code changes',
        description: 'This PR contains code changes',
        labels: [],
        reviewers: [],
        confidence: 0.5,
        kiroGenerated: false,
        fallback: true
      };
    }
    
    if (path.includes('/multimodal')) {
      return {
        interpretation: 'Fallback processing - Kiro AI unavailable',
        suggestions: ['Basic suggestion'],
        generatedContent: 'Fallback content',
        confidence: 0.5,
        kiroProcessed: false,
        fallback: true
      };
    }
    
    if (path.includes('/team')) {
      return {
        strengths: ['Team is active'],
        improvementAreas: ['More analysis needed'],
        recommendations: ['Continue development'],
        trends: {},
        kiroScore: 60,
        kiroAnalyzed: false,
        fallback: true
      };
    }
    
    return {
      message: 'Fallback response - service unavailable',
      fallback: true
    };
  }

  /**
   * Send error data to logging service (placeholder)
   */
  sendToLoggingService(logData) {
    // In a real implementation, this would send to a logging service
    // like Winston, Sentry, or a custom logging endpoint
    console.log('Would send to logging service:', logData);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {};
    
    for (const [service, errors] of this.errorCounts.entries()) {
      const breaker = this.circuitBreaker.get(service);
      stats[service] = {
        errorCount: errors.length,
        circuitOpen: breaker?.isOpen || false,
        lastError: errors.length > 0 ? new Date(Math.max(...errors)).toISOString() : null
      };
    }
    
    return stats;
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(service) {
    this.circuitBreaker.delete(service);
    this.errorCounts.delete(service);
    console.info(`Circuit breaker manually reset for ${service}`);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    this.circuitBreaker.clear();
    this.errorCounts.clear();
    console.info('All circuit breakers reset');
  }
}

module.exports = new KiroErrorHandler();