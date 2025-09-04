/**
 * Code Analysis Controller
 * Handles code analysis business logic and database operations
 */

const CodeAnalysis = require('../models/CodeAnalysis');
const KiroCodeAnalyzer = require('../services/kiroCodeAnalyzer');
const cacheService = require('../services/cacheService');
const kiroLogger = require('../utils/kiroLogger');
const crypto = require('crypto');

class CodeAnalysisController {
  constructor() {
    this.kiroAnalyzer = new KiroCodeAnalyzer();
  }

  /**
   * Analyze code and store results
   * @param {string} codeContent - Code to analyze
   * @param {string} filePath - File path
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeCode(codeContent, filePath, userId, options = {}) {
    const startTime = Date.now();
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const codeHash = crypto.createHash('md5').update(codeContent).digest('hex');

    try {
      // Check cache first
      const cachedResult = await cacheService.getCachedAnalysisResult(
        codeContent, filePath, userId, options
      );

      if (cachedResult) {
        // Log cache hit
        await kiroLogger.logInteraction('code_analysis', 'cache_hit', {
          userId,
          filePath,
          analysisId,
          codeHash
        }, {
          success: true,
          duration: Date.now() - startTime
        }, 0, { userId });

        return {
          ...cachedResult,
          analysisId,
          fromCache: true
        };
      }

      // Check database for recent analysis of same code
      const existingAnalysis = await CodeAnalysis.findByCodeHash(codeHash, userId);
      if (existingAnalysis) {
        // Cache the existing result
        await cacheService.cacheAnalysisResult(
          codeContent, filePath, userId, existingAnalysis.toObject(), options
        );

        return {
          ...existingAnalysis.toObject(),
          analysisId,
          fromDatabase: true
        };
      }

      // Create new analysis record
      const analysisRecord = new CodeAnalysis({
        analysisId,
        userId,
        filePath,
        codeHash,
        repository: options.repository || {},
        status: 'pending'
      });

      await analysisRecord.save();

      // Perform analysis with Kiro AI
      const analysisResult = await this.kiroAnalyzer.analyzeCode(codeContent, filePath, options);

      // Update analysis record with results
      analysisRecord.qualityScore = analysisResult.qualityScore;
      analysisRecord.suggestions = this.formatSuggestionsForDB(analysisResult.suggestions || []);
      analysisRecord.patterns = analysisResult.patterns || [];
      analysisRecord.securityIssues = analysisResult.securityIssues || [];
      analysisRecord.metrics = {
        complexity: analysisResult.metrics?.complexity || 0,
        maintainabilityIndex: analysisResult.metrics?.maintainabilityIndex || 0,
        testCoverage: options.testCoverage || null,
        linesOfCode: codeContent.split('\n').length,
        language: this.detectLanguage(filePath)
      };
      analysisRecord.performance = {
        analysisTime: Date.now() - startTime,
        cacheHit: false
      };
      analysisRecord.kiroAnalyzed = analysisResult.kiroAnalyzed || false;
      analysisRecord.fallback = analysisResult.fallback || false;
      analysisRecord.status = 'complete';

      await analysisRecord.save();

      // Cache the result
      await cacheService.cacheAnalysisResult(
        codeContent, filePath, userId, analysisRecord.toObject(), options
      );

      // Log successful analysis
      await kiroLogger.logInteraction('code_analysis', 'complete', {
        userId,
        filePath,
        analysisId,
        qualityScore: analysisResult.qualityScore,
        suggestionCount: analysisResult.suggestions?.length || 0,
        kiroAnalyzed: analysisResult.kiroAnalyzed
      }, {
        success: true,
        duration: Date.now() - startTime
      }, 0, { userId });

      return {
        ...analysisRecord.toObject(),
        fromCache: false,
        fromDatabase: false
      };

    } catch (error) {
      console.error('Code analysis error:', error);

      // Update analysis record with error
      try {
        await CodeAnalysis.findOneAndUpdate(
          { analysisId },
          {
            status: 'error',
            error: {
              message: error.message,
              stack: error.stack
            }
          }
        );
      } catch (updateError) {
        console.error('Failed to update analysis record with error:', updateError);
      }

      // Log error
      await kiroLogger.logError('code_analysis', error, {
        userId,
        filePath,
        analysisId
      });

      throw error;
    }
  }

  /**
   * Batch analyze multiple files
   * @param {Array} files - Array of {content, path} objects
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Batch analysis results
   */
  async analyzeBatch(files, userId, options = {}) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();

    try {
      const analysisPromises = files.map(file => 
        this.analyzeCode(file.content, file.path, userId, options)
          .catch(error => ({
            error: error.message,
            filePath: file.path,
            success: false
          }))
      );

      const results = await Promise.all(analysisPromises);
      const successful = results.filter(r => !r.error);

      // Log batch analysis
      await kiroLogger.logInteraction('code_analysis', 'batch_complete', {
        userId,
        batchId,
        fileCount: files.length,
        successfulAnalyses: successful.length
      }, {
        success: true,
        duration: Date.now() - startTime
      }, 0, { userId });

      return {
        batchId,
        results,
        summary: {
          totalFiles: files.length,
          successfulAnalyses: successful.length,
          failedAnalyses: results.length - successful.length,
          averageQualityScore: successful.length > 0 ? 
            Math.round(successful.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / successful.length) : 0,
          totalSuggestions: successful.reduce((sum, r) => sum + (r.suggestions?.length || 0), 0)
        }
      };

    } catch (error) {
      console.error('Batch analysis error:', error);
      
      await kiroLogger.logError('code_analysis', error, {
        userId,
        batchId,
        fileCount: files.length
      });

      throw error;
    }
  }

  /**
   * Get analysis history for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Analysis history
   */
  async getAnalysisHistory(userId, filters = {}, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;
    const query = { userId, status: 'complete' };

    // Apply filters
    if (filters.filePath) {
      query.filePath = { $regex: filters.filePath, $options: 'i' };
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    if (filters.minQualityScore) {
      query.qualityScore = { $gte: parseInt(filters.minQualityScore) };
    }

    try {
      const [history, total] = await Promise.all([
        CodeAnalysis.find(query)
          .sort({ createdAt: -1 })
          .skip(parseInt(offset))
          .limit(parseInt(limit))
          .select('analysisId filePath qualityScore suggestions createdAt performance kiroAnalyzed')
          .lean(),
        CodeAnalysis.countDocuments(query)
      ]);

      // Add suggestion counts to each analysis
      const enrichedHistory = history.map(analysis => ({
        ...analysis,
        suggestionCount: analysis.suggestions?.length || 0,
        duration: analysis.performance?.analysisTime || 0
      }));

      return {
        history: enrichedHistory,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        },
        stats: {
          totalAnalyses: total,
          averageQualityScore: total > 0 ? 
            Math.round(history.reduce((sum, h) => sum + h.qualityScore, 0) / total) : 0,
          totalSuggestions: history.reduce((sum, h) => sum + (h.suggestions?.length || 0), 0)
        }
      };

    } catch (error) {
      console.error('Get analysis history error:', error);
      throw error;
    }
  }

  /**
   * Get user analysis statistics
   * @param {string} userId - User ID
   * @param {string} period - Time period
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(userId, period = '7d') {
    try {
      // Check cache first
      const cachedStats = await cacheService.getCachedUserStats(userId, period);
      if (cachedStats) {
        return cachedStats;
      }

      // Calculate stats from database
      const stats = await CodeAnalysis.getUserStats(userId, period);
      
      if (stats.length === 0) {
        const emptyStats = {
          period,
          totalAnalyses: 0,
          averageQualityScore: 0,
          totalSuggestions: 0,
          topIssueTypes: [],
          qualityTrend: [],
          mostAnalyzedFiles: []
        };

        await cacheService.cacheUserStats(userId, period, emptyStats);
        return emptyStats;
      }

      const result = stats[0];
      
      // Process suggestion types and severities
      const typeCount = {};
      const severityCount = {};
      
      result.suggestionsByType.flat().forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      
      result.suggestionsBySeverity.flat().forEach(severity => {
        severityCount[severity] = (severityCount[severity] || 0) + 1;
      });

      const formattedStats = {
        period,
        totalAnalyses: result.totalAnalyses,
        averageQualityScore: Math.round(result.averageQualityScore || 0),
        totalSuggestions: result.totalSuggestions,
        topIssueTypes: Object.entries(typeCount)
          .map(([type, count]) => ({
            type,
            count,
            percentage: Math.round((count / result.totalSuggestions) * 100)
          }))
          .sort((a, b) => b.count - a.count),
        severityBreakdown: Object.entries(severityCount)
          .map(([severity, count]) => ({
            severity,
            count,
            percentage: Math.round((count / result.totalSuggestions) * 100)
          }))
          .sort((a, b) => b.count - a.count),
        generatedAt: new Date().toISOString()
      };

      // Cache the stats
      await cacheService.cacheUserStats(userId, period, formattedStats);

      return formattedStats;

    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Update suggestion status and feedback
   * @param {string} analysisId - Analysis ID
   * @param {string} suggestionId - Suggestion ID
   * @param {string} status - New status
   * @param {Object} feedback - Feedback data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated suggestion
   */
  async updateSuggestionStatus(analysisId, suggestionId, status, feedback, userId) {
    try {
      const analysis = await CodeAnalysis.findOne({ analysisId, userId });
      
      if (!analysis) {
        throw new Error('Analysis not found');
      }

      await analysis.updateSuggestionStatus(suggestionId, status, feedback);

      // Invalidate user's cache
      await cacheService.invalidateUserStatsCache(userId);

      // Log feedback
      await kiroLogger.logInteraction('suggestion_feedback', 'submit', {
        userId,
        analysisId,
        suggestionId,
        status,
        feedback
      }, {
        success: true
      }, 0, { userId });

      return analysis.suggestions.id(suggestionId);

    } catch (error) {
      console.error('Update suggestion status error:', error);
      throw error;
    }
  }

  /**
   * Get filtered suggestions for a file
   * @param {string} filePath - File path
   * @param {string} userId - User ID
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Filtered suggestions
   */
  async getFilteredSuggestions(filePath, userId, filters = {}, pagination = {}) {
    const { limit = 50, offset = 0 } = pagination;

    try {
      // Find recent analysis for this file
      const analysis = await CodeAnalysis.findOne({
        filePath,
        userId,
        status: 'complete'
      }).sort({ createdAt: -1 });

      if (!analysis) {
        return {
          suggestions: [],
          pagination: { total: 0, limit, offset, hasMore: false },
          filePath
        };
      }

      // Get filtered suggestions
      const filteredSuggestions = analysis.getFilteredSuggestions(filters);
      
      // Apply pagination
      const total = filteredSuggestions.length;
      const paginatedSuggestions = filteredSuggestions.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

      return {
        suggestions: paginatedSuggestions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        },
        filters,
        filePath,
        analysisId: analysis.analysisId,
        qualityScore: analysis.qualityScore
      };

    } catch (error) {
      console.error('Get filtered suggestions error:', error);
      throw error;
    }
  }

  // Private helper methods

  formatSuggestionsForDB(suggestions) {
    return suggestions.map((suggestion, index) => ({
      id: suggestion.id || `suggestion_${index + 1}`,
      type: suggestion.type,
      severity: suggestion.severity,
      line: suggestion.line || 0,
      column: suggestion.column || 0,
      message: suggestion.message || suggestion.description,
      description: suggestion.description,
      suggestedFix: suggestion.suggestedFix,
      confidence: suggestion.confidence,
      kiroReasoning: suggestion.kiroReasoning || 'AI analysis',
      status: 'pending'
    }));
  }

  detectLanguage(filePath) {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust'
    };
    return languageMap[extension] || 'unknown';
  }
}

module.exports = CodeAnalysisController;