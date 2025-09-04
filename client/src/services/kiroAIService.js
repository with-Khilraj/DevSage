/**
 * Client-side Kiro AI Service
 * Handles communication with backend Kiro AI services and provides frontend integration
 */

import Api from '../Api';

class KiroAIService {
  constructor() {
    this.baseURL = '/api/kiro';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Process multimodal input (text, image, voice)
   * @param {string} inputType - 'text', 'image', or 'voice'
   * @param {any} data - Input data
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Processed result
   */
  async processMultimodalInput(inputType, data, context = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/multimodal`, {
        inputType,
        data,
        context
      });

      return {
        success: true,
        ...response.data,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Multimodal processing failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Analyze code with Kiro AI
   * @param {string} codeContent - Code to analyze
   * @param {string} filePath - File path
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeCode(codeContent, filePath, options = {}) {
    const cacheKey = this.generateCacheKey('analyze', codeContent, filePath);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.data, fromCache: true };
      }
    }

    try {
      const response = await Api.post(`${this.baseURL}/analyze`, {
        codeContent,
        filePath,
        options
      });

      const result = {
        success: true,
        ...response.data,
        analyzedAt: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        success: false,
        error: error.message,
        suggestions: [],
        qualityScore: 0
      };
    }
  }

  /**
   * Get filtered code suggestions
   * @param {string} codeContent - Code content
   * @param {string} filePath - File path
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered suggestions
   */
  async getCodeSuggestions(codeContent, filePath, filters = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/suggestions`, {
        codeContent,
        filePath,
        filters
      });

      return {
        success: true,
        suggestions: response.data.suggestions || [],
        totalCount: response.data.totalCount || 0,
        filteredCount: response.data.filteredCount || 0
      };
    } catch (error) {
      console.error('Getting suggestions failed:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Generate commit message
   * @param {string} diff - Git diff
   * @param {Object} context - Commit context
   * @returns {Promise<Object>} Generated commit message
   */
  async generateCommitMessage(diff, context = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/generate/commit`, {
        diff,
        context
      });

      return {
        success: true,
        ...response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Commit message generation failed:', error);
      return {
        success: false,
        error: error.message,
        title: 'Update code',
        body: '',
        fallback: true
      };
    }
  }

  /**
   * Generate PR content
   * @param {Array} commits - Array of commits
   * @param {string} diff - Combined diff
   * @param {Object} context - PR context
   * @returns {Promise<Object>} Generated PR content
   */
  async generatePRContent(commits, diff, context = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/generate/pr`, {
        commits,
        diff,
        context
      });

      return {
        success: true,
        ...response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('PR content generation failed:', error);
      return {
        success: false,
        error: error.message,
        title: 'Code changes',
        description: 'This PR contains code changes',
        fallback: true
      };
    }
  }

  /**
   * Generate changelog
   * @param {Array} commits - Array of commits
   * @param {Array} prs - Array of PRs
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated changelog
   */
  async generateChangelog(commits, prs = [], options = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/generate/changelog`, {
        commits,
        prs,
        options
      });

      return {
        success: true,
        ...response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Changelog generation failed:', error);
      return {
        success: false,
        error: error.message,
        formatted: '# Changelog\n\nNo changes available.',
        fallback: true
      };
    }
  }

  /**
   * Analyze team patterns
   * @param {Object} teamData - Team data
   * @param {Object} timeRange - Time range
   * @returns {Promise<Object>} Team insights
   */
  async analyzeTeamPatterns(teamData, timeRange = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/analyze/team`, {
        teamData,
        timeRange
      });

      return {
        success: true,
        ...response.data,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Team analysis failed:', error);
      return {
        success: false,
        error: error.message,
        strengths: [],
        improvementAreas: [],
        recommendations: []
      };
    }
  }

  /**
   * Process voice input
   * @param {Blob} audioBlob - Audio data
   * @param {Object} context - Voice context
   * @returns {Promise<Object>} Processed voice input
   */
  async processVoiceInput(audioBlob, context = {}) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('context', JSON.stringify(context));

      const response = await Api.post(`${this.baseURL}/voice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        ...response.data,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Voice processing failed:', error);
      return {
        success: false,
        error: error.message,
        transcript: '',
        interpretation: 'Voice processing unavailable'
      };
    }
  }

  /**
   * Process image input (sketches, mockups, etc.)
   * @param {File} imageFile - Image file
   * @param {Object} context - Image context
   * @returns {Promise<Object>} Processed image input
   */
  async processImageInput(imageFile, context = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('context', JSON.stringify(context));

      const response = await Api.post(`${this.baseURL}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        ...response.data,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      return {
        success: false,
        error: error.message,
        description: 'Image processing unavailable',
        suggestions: []
      };
    }
  }

  /**
   * Get AI service status
   * @returns {Promise<Object>} Service status
   */
  async getServiceStatus() {
    try {
      const response = await Api.get(`${this.baseURL}/status`);
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('Failed to get service status:', error);
      return {
        success: false,
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Batch analyze multiple files
   * @param {Array} files - Array of file objects
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Batch analysis results
   */
  async batchAnalyze(files, options = {}) {
    try {
      const response = await Api.post(`${this.baseURL}/analyze/batch`, {
        files,
        options
      });

      return {
        success: true,
        ...response.data,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Batch analysis failed:', error);
      return {
        success: false,
        error: error.message,
        results: [],
        summary: { averageQuality: 0, totalSuggestions: 0 }
      };
    }
  }

  /**
   * Get analysis history for a file
   * @param {string} filePath - File path
   * @param {number} limit - Number of results to return
   * @returns {Promise<Object>} Analysis history
   */
  async getAnalysisHistory(filePath, limit = 10) {
    try {
      const response = await Api.get(`${this.baseURL}/history/${encodeURIComponent(filePath)}`, {
        params: { limit }
      });

      return {
        success: true,
        history: response.data.history || [],
        totalCount: response.data.totalCount || 0
      };
    } catch (error) {
      console.error('Failed to get analysis history:', error);
      return {
        success: false,
        error: error.message,
        history: []
      };
    }
  }

  /**
   * Submit feedback on AI suggestions
   * @param {string} suggestionId - Suggestion ID
   * @param {string} feedback - Feedback type ('helpful', 'not-helpful', 'incorrect')
   * @param {string} comment - Optional comment
   * @returns {Promise<Object>} Feedback submission result
   */
  async submitFeedback(suggestionId, feedback, comment = '') {
    try {
      const response = await Api.post(`${this.baseURL}/feedback`, {
        suggestionId,
        feedback,
        comment
      });

      return {
        success: true,
        message: 'Feedback submitted successfully'
      };
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility methods

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

  /**
   * Set cache timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  setCacheTimeout(timeout) {
    this.cacheTimeout = timeout;
  }
}

// Create and export singleton instance
const kiroAIService = new KiroAIService();
export default kiroAIService;