/**
 * Kiro Code Analyzer - Specialized service for code analysis using Kiro AI
 * Handles code quality assessment, security analysis, and improvement suggestions
 */

const KiroAIService = require('./kiroAIService');

class KiroCodeAnalyzer {
  constructor() {
    this.kiroAI = new KiroAIService();
    this.analysisCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Analyze code with comprehensive quality assessment
   * @param {string} codeContent - Code to analyze
   * @param {string} filePath - File path for context
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Comprehensive analysis results
   */
  async analyzeCode(codeContent, filePath, options = {}) {
    const cacheKey = this.generateCacheKey(codeContent, filePath, options);
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.result, fromCache: true };
      }
    }

    try {
      const analysis = await this.kiroAI.analyzeCode(codeContent, filePath, options.repository);
      
      // Enhance analysis with additional processing
      const enhancedAnalysis = await this.enhanceAnalysis(analysis, codeContent, filePath, options);
      
      // Cache the result
      this.analysisCache.set(cacheKey, {
        result: enhancedAnalysis,
        timestamp: Date.now()
      });

      return enhancedAnalysis;
    } catch (error) {
      console.error('Code analysis failed:', error);
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple files in batch
   * @param {Array} files - Array of {content, path} objects
   * @param {Object} options - Analysis options
   * @returns {Promise<Array>} Array of analysis results
   */
  async analyzeBatch(files, options = {}) {
    const analysisPromises = files.map(file => 
      this.analyzeCode(file.content, file.path, options)
        .catch(error => ({
          error: error.message,
          filePath: file.path,
          success: false
        }))
    );

    const results = await Promise.all(analysisPromises);
    
    return {
      results,
      summary: this.generateBatchSummary(results),
      totalFiles: files.length,
      successfulAnalyses: results.filter(r => !r.error).length
    };
  }

  /**
   * Get suggestions filtered by criteria
   * @param {string} codeContent - Code content
   * @param {string} filePath - File path
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered suggestions
   */
  async getSuggestions(codeContent, filePath, filters = {}) {
    const analysis = await this.analyzeCode(codeContent, filePath);
    
    let suggestions = analysis.suggestions || [];

    // Apply filters
    if (filters.severity) {
      suggestions = suggestions.filter(s => 
        filters.severity.includes(s.severity)
      );
    }

    if (filters.type) {
      suggestions = suggestions.filter(s => 
        filters.type.includes(s.type)
      );
    }

    if (filters.minConfidence) {
      suggestions = suggestions.filter(s => 
        s.confidence >= filters.minConfidence
      );
    }

    // Sort by priority
    suggestions.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      return (b.confidence || 0) - (a.confidence || 0);
    });

    return suggestions;
  }

  /**
   * Analyze code security specifically
   * @param {string} codeContent - Code to analyze
   * @param {string} filePath - File path
   * @returns {Promise<Object>} Security analysis results
   */
  async analyzeCodeSecurity(codeContent, filePath) {
    const analysis = await this.analyzeCode(codeContent, filePath);
    
    return {
      securityScore: this.calculateSecurityScore(analysis),
      vulnerabilities: analysis.securityIssues || [],
      securitySuggestions: (analysis.suggestions || []).filter(s => s.type === 'security'),
      riskLevel: this.calculateRiskLevel(analysis.securityIssues || []),
      recommendations: this.generateSecurityRecommendations(analysis)
    };
  }

  /**
   * Analyze code performance
   * @param {string} codeContent - Code to analyze
   * @param {string} filePath - File path
   * @returns {Promise<Object>} Performance analysis results
   */
  async analyzeCodePerformance(codeContent, filePath) {
    const analysis = await this.analyzeCode(codeContent, filePath);
    
    return {
      performanceScore: this.calculatePerformanceScore(analysis),
      performanceSuggestions: (analysis.suggestions || []).filter(s => s.type === 'performance'),
      bottlenecks: this.identifyBottlenecks(analysis),
      optimizations: this.generateOptimizations(analysis)
    };
  }

  // Private helper methods

  async enhanceAnalysis(baseAnalysis, codeContent, filePath, options) {
    return {
      ...baseAnalysis,
      fileInfo: {
        path: filePath,
        size: codeContent.length,
        lines: codeContent.split('\n').length,
        language: this.detectLanguage(filePath)
      },
      metrics: {
        complexity: this.calculateComplexity(codeContent),
        maintainabilityIndex: this.calculateMaintainabilityIndex(baseAnalysis),
        testCoverage: options.testCoverage || null
      },
      enhancedAt: new Date().toISOString()
    };
  }

  generateCacheKey(codeContent, filePath, options) {
    const hash = require('crypto')
      .createHash('md5')
      .update(codeContent + filePath + JSON.stringify(options))
      .digest('hex');
    return hash;
  }

  generateBatchSummary(results) {
    const successful = results.filter(r => !r.error);
    
    if (successful.length === 0) {
      return { averageQuality: 0, totalSuggestions: 0, criticalIssues: 0 };
    }

    const totalQuality = successful.reduce((sum, r) => sum + (r.qualityScore || 0), 0);
    const totalSuggestions = successful.reduce((sum, r) => sum + (r.suggestions?.length || 0), 0);
    const criticalIssues = successful.reduce((sum, r) => 
      sum + (r.suggestions?.filter(s => s.severity === 'critical').length || 0), 0
    );

    return {
      averageQuality: Math.round(totalQuality / successful.length),
      totalSuggestions,
      criticalIssues,
      filesAnalyzed: successful.length
    };
  }

  calculateSecurityScore(analysis) {
    const baseScore = analysis.qualityScore || 70;
    const securityIssues = analysis.securityIssues || [];
    const securitySuggestions = (analysis.suggestions || []).filter(s => s.type === 'security');
    
    let deduction = 0;
    securityIssues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': deduction += 20; break;
        case 'high': deduction += 10; break;
        case 'medium': deduction += 5; break;
        case 'low': deduction += 2; break;
      }
    });

    securitySuggestions.forEach(suggestion => {
      switch (suggestion.severity) {
        case 'critical': deduction += 15; break;
        case 'high': deduction += 8; break;
        case 'medium': deduction += 3; break;
        case 'low': deduction += 1; break;
      }
    });

    return Math.max(0, Math.min(100, baseScore - deduction));
  }

  calculatePerformanceScore(analysis) {
    const baseScore = analysis.qualityScore || 70;
    const performanceSuggestions = (analysis.suggestions || []).filter(s => s.type === 'performance');
    
    let deduction = 0;
    performanceSuggestions.forEach(suggestion => {
      switch (suggestion.severity) {
        case 'critical': deduction += 15; break;
        case 'high': deduction += 8; break;
        case 'medium': deduction += 4; break;
        case 'low': deduction += 1; break;
      }
    });

    return Math.max(0, Math.min(100, baseScore - deduction));
  }

  calculateRiskLevel(securityIssues) {
    if (securityIssues.some(issue => issue.severity === 'critical')) return 'critical';
    if (securityIssues.some(issue => issue.severity === 'high')) return 'high';
    if (securityIssues.some(issue => issue.severity === 'medium')) return 'medium';
    if (securityIssues.length > 0) return 'low';
    return 'minimal';
  }

  generateSecurityRecommendations(analysis) {
    const recommendations = [];
    const securityIssues = analysis.securityIssues || [];
    
    if (securityIssues.length > 0) {
      recommendations.push('Address identified security vulnerabilities immediately');
    }
    
    const securitySuggestions = (analysis.suggestions || []).filter(s => s.type === 'security');
    if (securitySuggestions.length > 0) {
      recommendations.push('Implement suggested security improvements');
    }
    
    recommendations.push('Regular security audits recommended');
    return recommendations;
  }

  identifyBottlenecks(analysis) {
    return (analysis.suggestions || [])
      .filter(s => s.type === 'performance' && s.severity === 'high')
      .map(s => ({
        description: s.description,
        impact: 'high',
        suggestedFix: s.suggestedFix
      }));
  }

  generateOptimizations(analysis) {
    return (analysis.suggestions || [])
      .filter(s => s.type === 'performance')
      .map(s => ({
        optimization: s.description,
        expectedImprovement: this.estimateImprovement(s),
        implementation: s.suggestedFix
      }));
  }

  estimateImprovement(suggestion) {
    switch (suggestion.severity) {
      case 'critical': return 'High performance gain expected';
      case 'high': return 'Moderate performance gain expected';
      case 'medium': return 'Small performance gain expected';
      case 'low': return 'Minimal performance gain expected';
      default: return 'Performance impact unclear';
    }
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

  calculateComplexity(codeContent) {
    // Simple complexity calculation based on control structures
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g
    ];

    let complexity = 1; // Base complexity
    complexityPatterns.forEach(pattern => {
      const matches = codeContent.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  calculateMaintainabilityIndex(analysis) {
    // Simplified maintainability index calculation
    const qualityScore = analysis.qualityScore || 70;
    const suggestionCount = (analysis.suggestions || []).length;
    
    // Deduct points for suggestions
    let maintainability = qualityScore - (suggestionCount * 2);
    
    // Bonus for good patterns
    if (analysis.patterns && analysis.patterns.length > 0) {
      maintainability += analysis.patterns.length * 3;
    }
    
    return Math.max(0, Math.min(100, maintainability));
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.analysisCache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.analysisCache.keys())
    };
  }
}

module.exports = KiroCodeAnalyzer;