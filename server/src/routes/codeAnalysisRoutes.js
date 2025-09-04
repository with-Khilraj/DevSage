/**
 * Code Analysis Routes
 * API endpoints for Kiro AI code analysis functionality
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const CodeAnalysisController = require('../controllers/codeAnalysisController');
const socketService = require('../services/socketService');
const kiroLogger = require('../utils/kiroLogger');

const router = express.Router();
const analysisController = new CodeAnalysisController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/analysis/analyze
 * Analyze code with Kiro AI
 */
router.post('/analyze', async (req, res) => {
    try {
        const { codeContent, filePath, options = {} } = req.body;
        const userId = req.user._id;

        // Validation
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

        // Generate analysis ID
        const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        // Send immediate response
        res.json({
            success: true,
            analysisId,
            message: 'Code analysis started',
            filePath,
            timestamp: new Date().toISOString()
        });

        // Notify via WebSocket that analysis started
        socketService.sendUpdateToUser(userId, 'code_analysis_started', {
            analysisId,
            filePath,
            timestamp: new Date().toISOString()
        });

        // Perform analysis and send results via WebSocket
        try {
            const result = await analysisController.analyzeCode(codeContent, filePath, userId, {
                ...options,
                repository: options.repository || { name: 'unknown' }
            });

            // Send completion notification
            socketService.sendUpdateToUser(userId, 'code_analysis_complete', {
                analysisId: result.analysisId || analysisId,
                filePath,
                ...result,
                timestamp: new Date().toISOString()
            });

        } catch (analysisError) {
            console.error('Analysis error:', analysisError);

            // Send error notification
            socketService.sendUpdateToUser(userId, 'code_analysis_error', {
                analysisId,
                filePath,
                error: analysisError.message,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Code analysis request error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to start code analysis',
            message: error.message
        });
    }
});

/**
 * POST /api/analysis/batch
 * Batch analyze multiple files
 */
router.post('/batch', async (req, res) => {
    try {
        const { files, options = {} } = req.body;
        const userId = req.user._id;

        // Validation
        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Files array is required and must not be empty'
            });
        }

        // Validate each file
        for (const file of files) {
            if (!file.content || !file.path) {
                return res.status(400).json({
                    success: false,
                    error: 'Each file must have content and path properties'
                });
            }
        }

        // Generate batch analysis ID
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        // Send immediate response
        res.json({
            success: true,
            batchId,
            message: 'Batch analysis started',
            fileCount: files.length,
            timestamp: new Date().toISOString()
        });

        // Notify via WebSocket
        socketService.sendUpdateToUser(userId, 'batch_analysis_started', {
            batchId,
            fileCount: files.length,
            timestamp: new Date().toISOString()
        });

        // Perform batch analysis
        try {
            const results = await analysisController.analyzeBatch(files, userId, options);

            // Send completion notification
            socketService.sendUpdateToUser(userId, 'batch_analysis_complete', {
                batchId: results.batchId || batchId,
                ...results,
                timestamp: new Date().toISOString()
            });

        } catch (batchError) {
            console.error('Batch analysis error:', batchError);

            // Send error notification
            socketService.sendUpdateToUser(userId, 'batch_analysis_error', {
                batchId,
                error: batchError.message,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Batch analysis request error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to start batch analysis',
            message: error.message
        });
    }
});

/**
 * GET /api/analysis/suggestions/:filePath
 * Get filtered suggestions for a file
 */
router.get('/suggestions/:filePath', async (req, res) => {
    try {
        const filePath = decodeURIComponent(req.params.filePath);
        const {
            severity,
            type,
            minConfidence = 0.5,
            limit = 50,
            offset = 0
        } = req.query;

        // Build filters
        const filters = {
            minConfidence: parseFloat(minConfidence)
        };

        if (severity) {
            filters.severity = Array.isArray(severity) ? severity : [severity];
        }

        if (type) {
            filters.type = Array.isArray(type) ? type : [type];
        }

        // Get filtered suggestions from controller
        const result = await analysisController.getFilteredSuggestions(
            filePath,
            req.user._id,
            filters,
            { limit: parseInt(limit), offset: parseInt(offset) }
        );

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Get suggestions error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get suggestions',
            message: error.message
        });
    }
});

/**
 * POST /api/analysis/:analysisId/suggestions/:suggestionId/status
 * Update suggestion status (accept, reject, apply)
 */
router.post('/:analysisId/suggestions/:suggestionId/status', async (req, res) => {
    try {
        const { analysisId, suggestionId } = req.params;
        const { status, feedback } = req.body;
        const userId = req.user._id;

        // Validation
        if (!status || !['accepted', 'rejected', 'applied'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Valid status is required (accepted, rejected, applied)'
            });
        }

        // Update suggestion status
        const updatedSuggestion = await analysisController.updateSuggestionStatus(
            analysisId, suggestionId, status, feedback, userId
        );

        res.json({
            success: true,
            message: 'Suggestion status updated successfully',
            suggestion: updatedSuggestion
        });

    } catch (error) {
        console.error('Update suggestion status error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to update suggestion status',
            message: error.message
        });
    }
});

/**
 * POST /api/analysis/suggestions/:suggestionId/feedback
 * Submit feedback for a suggestion
 */
router.post('/suggestions/:suggestionId/feedback', async (req, res) => {
    try {
        const { suggestionId } = req.params;
        const { feedback, comment = '' } = req.body;
        const userId = req.user._id;

        // Validation
        if (!feedback || !['helpful', 'not-helpful', 'incorrect'].includes(feedback)) {
            return res.status(400).json({
                success: false,
                error: 'Valid feedback is required (helpful, not-helpful, incorrect)'
            });
        }

        // For feedback, we need the analysis ID - this would come from the frontend
        // For now, we'll just log the feedback
        await kiroLogger.logInteraction('suggestion_feedback', 'submit', {
            userId: userId,
            suggestionId: suggestionId,
            feedback: feedback,
            comment: comment
        }, {
            success: true
        }, 0, {
            userId: userId
        });

        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            suggestionId,
            feedback
        });

    } catch (error) {
        console.error('Submit feedback error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback',
            message: error.message
        });
    }
});

/**
 * GET /api/analysis/history
 * Get analysis history for user
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            limit = 20,
            offset = 0,
            filePath,
            dateFrom,
            dateTo
        } = req.query;

        // Get analysis history from controller
        const result = await analysisController.getAnalysisHistory(
            userId,
            { filePath, dateFrom, dateTo },
            { limit: parseInt(limit), offset: parseInt(offset) }
        );

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Get history error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get analysis history',
            message: error.message
        });
    }
});

/**
 * GET /api/analysis/stats
 * Get analysis statistics for user
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user._id;
        const { period = '7d' } = req.query;

        // Get user stats from controller
        const stats = await analysisController.getUserStats(userId, period);

        res.json({
            success: true,
            stats,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get stats error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get analysis statistics',
            message: error.message
        });
    }
});

/**
 * GET /api/analysis/test
 * Test endpoint to verify code analysis functionality
 */
router.get('/test', async (req, res) => {
    try {
        const userId = req.user._id;

        // Test code sample
        const testCode = `
function processUserData(userData) {
  // Potential security issue - no input validation
  const query = "SELECT * FROM users WHERE id = " + userData.id;
  
  // Performance issue - inefficient loop
  for (let i = 0; i < userData.items.length; i++) {
    for (let j = 0; j < allItems.length; j++) {
      if (userData.items[i].id === allItems[j].id) {
        // Found match
        break;
      }
    }
  }
  
  return query;
}`;

        // Analyze the test code
        const result = await analysisController.analyzeCode(
            testCode,
            'test/sample.js',
            userId,
            { repository: { name: 'test-repo' } }
        );

        res.json({
            success: true,
            message: 'Code analysis test completed',
            result: {
                analysisId: result.analysisId,
                qualityScore: result.qualityScore,
                suggestionCount: result.suggestions?.length || 0,
                fromCache: result.fromCache || false,
                kiroAnalyzed: result.kiroAnalyzed || false,
                suggestions: result.suggestions?.slice(0, 3) || [] // Show first 3 suggestions
            }
        });

    } catch (error) {
        console.error('Test analysis error:', error);

        res.status(500).json({
            success: false,
            error: 'Test analysis failed',
            message: error.message
        });
    }
});

module.exports = router;