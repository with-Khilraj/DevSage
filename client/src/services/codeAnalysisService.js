/**
 * Code Analysis Service
 * Client-side service for code analysis functionality
 */

import Api from '../Api';

class CodeAnalysisService {
  constructor() {
    this.baseURL = '/api/analysis';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Analyze code with Kiro AI
   * @param {string} codeContent - Code to analyze
   * @param {string} filePath - File path
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeCode(codeContent, filePath, options = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/analyze`, {
        codeContent,
        filePath,
        options
      });

      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Batch analyze multiple files
   * @param {Array} files - Array of {content, path} objects
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Batch analysis result
   */
  async batchAnalyze(files, options = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/batch`, {
        files,
        options
      });

      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('Batch analysis failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get suggestions for a file
   * @param {string} filePath - File path
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Suggestions result
   */
  async getSuggestions(filePath, filters = {}) {
    const cacheKey = this.generateCacheKey('suggestions', filePath, filters);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.data, fromCache: true };
      }
    }

    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await Api.get(
        `${this.baseURL}/suggestions/${encodeURIComponent(filePath)}?${queryParams}`
      );

      const result = {
        success: true,
        ...response.data
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Get suggestions failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        suggestions: []
      };
    }
  }

  /**
   * Submit feedback for a suggestion
   * @param {string} suggestionId - Suggestion ID
   * @param {string} feedback - Feedback type
   * @param {string} comment - Optional comment
   * @returns {Promise<Object>} Feedback result
   */
  async submitFeedback(suggestionId, feedback, comment = '') {
    try {
      const response = await Api.post(
        `${this.baseURL}/suggestions/${suggestionId}/feedback`,
        { feedback, comment }
      );

      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('Submit feedback failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get analysis history
   * @param {Object} options - Query options
   * @returns {Promise<Object>} History result
   */
  async getHistory(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await Api.get(`${this.baseURL}/history?${queryParams}`);

      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('Get history failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        history: []
      };
    }
  }

  /**
   * Get analysis statistics
   * @param {string} period - Time period (7d, 30d, 90d)
   * @returns {Promise<Object>} Statistics result
   */
  async getStats(period = '7d') {
    const cacheKey = this.generateCacheKey('stats', period);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.data, fromCache: true };
      }
    }

    try {
      const response = await Api.get(`${this.baseURL}/stats?period=${period}`);

      const result = {
        success: true,
        ...response.data
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Get stats failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        stats: null
      };
    }
  }

  /**
   * Get suggestion severity color
   * @param {string} severity - Severity level
   * @returns {string} Tailwind color class
   */
  getSeverityColor(severity) {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/20 border-red-400/30';
      case 'high':
        return 'text-orange-500 bg-orange-500/20 border-orange-400/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/20 border-yellow-400/30';
      case 'low':
        return 'text-blue-500 bg-blue-500/20 border-blue-400/30';
      default:
        return 'text-gray-500 bg-gray-500/20 border-gray-400/30';
    }
  }

  /**
   * Get suggestion type icon
   * @param {string} type - Suggestion type
   * @returns {JSX.Element} Icon component
   */
  getTypeIcon(type) {
    switch (type) {
      case 'security':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'performance':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'maintainability':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'style':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v7z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  }

  /**
   * Format quality score
   * @param {number} score - Quality score (0-100)
   * @returns {Object} Formatted score with color and grade
   */
  formatQualityScore(score) {
    let grade, color;
    
    if (score >= 90) {
      grade = 'A+';
      color = 'text-green-500';
    } else if (score >= 80) {
      grade = 'A';
      color = 'text-green-400';
    } else if (score >= 70) {
      grade = 'B';
      color = 'text-yellow-500';
    } else if (score >= 60) {
      grade = 'C';
      color = 'text-orange-500';
    } else {
      grade = 'D';
      color = 'text-red-500';
    }

    return { score, grade, color };
  }

  /**
   * Generate cache key
   * @param {string} type - Cache type
   * @param {...any} args - Arguments to include in key
   * @returns {string} Cache key
   */
  generateCacheKey(type, ...args) {
    const content = args.join('|');
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${type}_${Math.abs(hash)}`;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
const codeAnalysisService = new CodeAnalysisService();
export default codeAnalysisService;