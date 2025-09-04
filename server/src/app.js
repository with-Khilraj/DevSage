/**
 * Express Application Setup
 * Main application configuration with Socket.io integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');

// Import services and middleware
const socketService = require('./services/socketService');
const kiroErrorHandler = require('./middleware/kiroErrorHandler');
const kiroLogger = require('./utils/kiroLogger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const kiroRoutes = require('./routes/kiroRoutes');
const codeAnalysisRoutes = require('./routes/codeAnalysisRoutes');

const app = express();
const server = createServer(app);

// Initialize Socket.io
socketService.initialize(server);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
    stream: {
        write: (message) => {
            kiroLogger.logInteraction('http', 'request', {}, {
                message: message.trim()
            }, 0);
        }
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    const socketStats = socketService.getStats();

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        socket: socketStats,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/kiro', kiroRoutes);
app.use('/api/analysis', codeAnalysisRoutes);

// Socket.io status endpoint
app.get('/api/socket/status', (req, res) => {
    const stats = socketService.getStats();
    res.json({
        success: true,
        ...stats
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use(kiroErrorHandler.middleware());

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);

    kiroLogger.logError('app', error, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

module.exports = { app, server };