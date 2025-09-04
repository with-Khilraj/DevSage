/**
 * Kiro AI API Routes
 * Handles all Kiro AI service endpoints with proper error handling and validation
 */

const express = require('express');
const multer = require('multer');
const KiroAIService = require('../services/kiroAIService');
const KiroCodeAnalyzer = require('../services/kiroCodeAnalyzer');
const KiroContentGenerator = require('../services/kiroContentGenerator');
const kiroErrorHandler = require('../middleware/kiroErrorHandler');

const router = express.Router();

// Initialize services
const kiroAI = new KiroAIService();
const kiroAnalyzer = new KiroCodeAnalyzer();
const kiroGenerator = new KiroContentGenerator();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      // Accept images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    } else if (file.fieldname === 'audio') {
      // Accept audio files only
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
});

// Validation middleware
const validateCodeAnalysis = (req, res, next) => {
  const { codeContent, filePath } = req.body;
  
  if (!codeContent || typeof codeContent !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Code content is required and must be a string'
    });
  }
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'File path is required and must be a string'
    });
  }
  
  next();
};

const validateCommitGeneration = (req, res, next) => {
  const { diff } = req.body;
  
  if (!diff || typeof diff !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Git diff is required and must be a string'
    });
  }
  
  next();
};

const validatePRGeneration = (req, res, next) => {
  const { commits, diff } = req.body;
  
  if (!Array.isArray(commits)) {
    return res.status(400).json({
      success: false,
      error: 'Commits must be an array'
    });
  }
  
  if (!diff || typeof diff !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Git diff is required and must be a string'
    });
  }
  
  next();
};

// Routes

/**
 * GET /api/kiro/status
 * Get Kiro AI service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      available: kiroAI.isAvailable(),
      services: {
        multimodal: true,
        codeAnalysis: true,
        contentGeneration: true,
        teamAnalytics: true
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

/**
 * POST /api/kiro/multimodal
 * Process multimodal input (text, voice, image)
 */
router.post('/multimodal', async (req, res, next) => {
  try {
    const { inputType, data, context = {} } = req.body;
    
    if (!inputType || !['text', 'voice', 'image'].includes(inputType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input type. Must be text, voice, or image'
      });
    }
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Input data is required'
      });
    }
    
    const result = await kiroAI.processMultimodalInput(inputType, data, context);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-multimodal';
    next(error);
  }
});

/**
 * POST /api/kiro/analyze
 * Analyze code with Kiro AI
 */
router.post('/analyze', validateCodeAnalysis, async (req, res, next) => {
  try {
    const { codeContent, filePath, options = {} } = req.body;
    
    const result = await kiroAnalyzer.analyzeCode(codeContent, filePath, options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-analysis';
    next(error);
  }
});

/**
 * POST /api/kiro/analyze/batch
 * Batch analyze multiple files
 */
router.post('/analyze/batch', async (req, res, next) => {
  try {
    const { files, options = {} } = req.body;
    
    if (!Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'Files must be an array'
      });
    }
    
    const result = await kiroAnalyzer.analyzeBatch(files, options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-analysis';
    next(error);
  }
});

/**
 * POST /api/kiro/suggestions
 * Get filtered code suggestions
 */
router.post('/suggestions', validateCodeAnalysis, async (req, res, next) => {
  try {
    const { codeContent, filePath, filters = {} } = req.body;
    
    const suggestions = await kiroAnalyzer.getSuggestions(codeContent, filePath, filters);
    
    res.json({
      success: true,
      suggestions,
      totalCount: suggestions.length,
      filteredCount: suggestions.length
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-analysis';
    next(error);
  }
});

/**
 * POST /api/kiro/generate/commit
 * Generate commit message
 */
router.post('/generate/commit', validateCommitGeneration, async (req, res, next) => {
  try {
    const { diff, context = {} } = req.body;
    
    const result = await kiroGenerator.generateCommitMessage(diff, context);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-commit';
    next(error);
  }
});

/**
 * POST /api/kiro/generate/pr
 * Generate PR content
 */
router.post('/generate/pr', validatePRGeneration, async (req, res, next) => {
  try {
    const { commits, diff, context = {} } = req.body;
    
    const result = await kiroGenerator.generatePRContent(commits, diff, context);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-pr';
    next(error);
  }
});

/**
 * POST /api/kiro/generate/changelog
 * Generate changelog
 */
router.post('/generate/changelog', async (req, res, next) => {
  try {
    const { commits, prs = [], options = {} } = req.body;
    
    if (!Array.isArray(commits)) {
      return res.status(400).json({
        success: false,
        error: 'Commits must be an array'
      });
    }
    
    const result = await kiroGenerator.generateChangelog(commits, prs, options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-changelog';
    next(error);
  }
});

/**
 * POST /api/kiro/analyze/team
 * Analyze team patterns
 */
router.post('/analyze/team', async (req, res, next) => {
  try {
    const { teamData, timeRange = {} } = req.body;
    
    if (!teamData || typeof teamData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Team data is required and must be an object'
      });
    }
    
    const result = await kiroAI.analyzeTeamPatterns(teamData, timeRange);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-team';
    next(error);
  }
});

/**
 * POST /api/kiro/voice
 * Process voice input
 */
router.post('/voice', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }
    
    const context = req.body.context ? JSON.parse(req.body.context) : {};
    
    // Convert buffer to blob-like object for processing
    const audioData = {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      size: req.file.size
    };
    
    const result = await kiroAI.processMultimodalInput('voice', audioData, context);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-voice';
    next(error);
  }
});

/**
 * POST /api/kiro/image
 * Process image input
 */
router.post('/image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }
    
    const context = req.body.context ? JSON.parse(req.body.context) : {};
    
    // Convert buffer to blob-like object for processing
    const imageData = {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      size: req.file.size,
      originalname: req.file.originalname
    };
    
    const result = await kiroAI.processMultimodalInput('image', imageData, context);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    error.source = 'kiro';
    error.service = 'kiro-image';
    next(error);
  }
});

/**
 * GET /api/kiro/history/:filePath
 * Get analysis history for a file
 */
router.get('/history/:filePath', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const limit = parseInt(req.query.limit) || 10;
    
    // This would typically query a database
    // For now, return empty history
    res.json({
      success: true,
      history: [],
      totalCount: 0,
      filePath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis history'
    });
  }
});

/**
 * POST /api/kiro/feedback
 * Submit feedback on AI suggestions
 */
router.post('/feedback', async (req, res) => {
  try {
    const { suggestionId, feedback, comment = '' } = req.body;
    
    if (!suggestionId || !feedback) {
      return res.status(400).json({
        success: false,
        error: 'Suggestion ID and feedback are required'
      });
    }
    
    if (!['helpful', 'not-helpful', 'incorrect'].includes(feedback)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback type'
      });
    }
    
    // Store feedback (would typically save to database)
    console.log('Feedback received:', { suggestionId, feedback, comment });
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

/**
 * GET /api/kiro/stats
 * Get error and performance statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const errorStats = kiroErrorHandler.getErrorStats();
    const cacheStats = {
      analyzer: kiroAnalyzer.getCacheStats(),
      generator: kiroGenerator.getCacheStats()
    };
    
    res.json({
      success: true,
      errors: errorStats,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

/**
 * POST /api/kiro/reset-circuit-breaker
 * Reset circuit breaker for a service (admin only)
 */
router.post('/reset-circuit-breaker', async (req, res) => {
  try {
    const { service } = req.body;
    
    if (service) {
      kiroErrorHandler.resetCircuitBreaker(service);
    } else {
      kiroErrorHandler.resetAllCircuitBreakers();
    }
    
    res.json({
      success: true,
      message: service ? `Circuit breaker reset for ${service}` : 'All circuit breakers reset'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset circuit breaker'
    });
  }
});

// Apply error handling middleware
router.use(kiroErrorHandler.middleware());

module.exports = router;