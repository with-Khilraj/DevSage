/**
 * Code Analysis Model
 * Stores code analysis results and suggestions from Kiro AI
 */

const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['security', 'performance', 'maintainability', 'style']
  },
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low']
  },
  line: {
    type: Number,
    required: true
  },
  column: {
    type: Number,
    default: 0
  },
  message: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  suggestedFix: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  kiroReasoning: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'applied'],
    default: 'pending'
  },
  feedback: {
    rating: {
      type: String,
      enum: ['helpful', 'not-helpful', 'incorrect']
    },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

const codeAnalysisSchema = new mongoose.Schema({
  analysisId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  codeHash: {
    type: String,
    required: true // MD5 hash of code content for caching
  },
  repository: {
    name: String,
    url: String,
    branch: String,
    commit: String
  },
  qualityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  suggestions: [suggestionSchema],
  patterns: [{
    type: String,
    description: String,
    positive: Boolean
  }],
  securityIssues: [{
    type: String,
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low']
    },
    description: String,
    cwe: String // Common Weakness Enumeration ID
  }],
  metrics: {
    complexity: Number,
    maintainabilityIndex: Number,
    testCoverage: Number,
    linesOfCode: Number,
    language: String
  },
  performance: {
    analysisTime: Number, // milliseconds
    cacheHit: Boolean
  },
  kiroAnalyzed: {
    type: Boolean,
    default: false
  },
  fallback: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'complete', 'error'],
    default: 'pending'
  },
  error: {
    message: String,
    stack: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
codeAnalysisSchema.index({ userId: 1, createdAt: -1 });
codeAnalysisSchema.index({ filePath: 1, userId: 1 });
codeAnalysisSchema.index({ codeHash: 1 });
codeAnalysisSchema.index({ 'suggestions.type': 1 });
codeAnalysisSchema.index({ 'suggestions.severity': 1 });
codeAnalysisSchema.index({ qualityScore: 1 });

// Virtual for suggestion counts by type
codeAnalysisSchema.virtual('suggestionCounts').get(function() {
  const counts = {
    security: 0,
    performance: 0,
    maintainability: 0,
    style: 0
  };
  
  this.suggestions.forEach(suggestion => {
    if (counts.hasOwnProperty(suggestion.type)) {
      counts[suggestion.type]++;
    }
  });
  
  return counts;
});

// Virtual for suggestion counts by severity
codeAnalysisSchema.virtual('severityCounts').get(function() {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  this.suggestions.forEach(suggestion => {
    if (counts.hasOwnProperty(suggestion.severity)) {
      counts[suggestion.severity]++;
    }
  });
  
  return counts;
});

// Method to get filtered suggestions
codeAnalysisSchema.methods.getFilteredSuggestions = function(filters = {}) {
  let suggestions = this.suggestions;
  
  if (filters.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    suggestions = suggestions.filter(s => types.includes(s.type));
  }
  
  if (filters.severity) {
    const severities = Array.isArray(filters.severity) ? filters.severity : [filters.severity];
    suggestions = suggestions.filter(s => severities.includes(s.severity));
  }
  
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    suggestions = suggestions.filter(s => statuses.includes(s.status));
  }
  
  if (filters.minConfidence) {
    suggestions = suggestions.filter(s => s.confidence >= filters.minConfidence);
  }
  
  // Sort by severity and confidence
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
};

// Method to update suggestion status
codeAnalysisSchema.methods.updateSuggestionStatus = function(suggestionId, status, feedback = null) {
  const suggestion = this.suggestions.id(suggestionId);
  if (suggestion) {
    suggestion.status = status;
    if (feedback) {
      suggestion.feedback = {
        ...feedback,
        submittedAt: new Date()
      };
    }
    return this.save();
  }
  throw new Error('Suggestion not found');
};

// Static method to find by code hash (for caching)
codeAnalysisSchema.statics.findByCodeHash = function(codeHash, userId, maxAge = 5 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAge);
  return this.findOne({
    codeHash,
    userId,
    createdAt: { $gte: cutoff },
    status: 'complete'
  }).sort({ createdAt: -1 });
};

// Static method to get user statistics
codeAnalysisSchema.statics.getUserStats = function(userId, period = '7d') {
  const periodMs = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const cutoff = new Date(Date.now() - (periodMs[period] || periodMs['7d']));
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: cutoff },
        status: 'complete'
      }
    },
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        averageQualityScore: { $avg: '$qualityScore' },
        totalSuggestions: { $sum: { $size: '$suggestions' } },
        suggestionsByType: {
          $push: {
            $map: {
              input: '$suggestions',
              as: 'suggestion',
              in: '$$suggestion.type'
            }
          }
        },
        suggestionsBySeverity: {
          $push: {
            $map: {
              input: '$suggestions',
              as: 'suggestion',
              in: '$$suggestion.severity'
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('CodeAnalysis', codeAnalysisSchema);