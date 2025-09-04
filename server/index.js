/**
 * DevSage Server Entry Point
 * Initializes database connections and starts the server
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { app, server } = require('./src/app');
const cacheService = require('./src/services/cacheService');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

// Startup function
async function startServer() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    try {
      await mongoose.connect(MONGO_URL, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 45000,
      });
      console.log('✅ MongoDB connected successfully');
    } catch (mongoError) {
      console.warn('⚠️  MongoDB connection failed, some features may not work:', mongoError.message);
      console.log('💡 To fix: Check your MongoDB Atlas IP whitelist or use local MongoDB');
      // Continue without MongoDB for basic testing
    }

    // Initialize cache service (Redis)
    console.log('Initializing cache service...');
    // Give cache service time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (cacheService.isAvailable()) {
      console.log('✅ Redis cache connected successfully');
    } else {
      console.log('⚠️  Redis cache not available, continuing without cache');
    }

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 DevSage server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Code analysis test: http://localhost:${PORT}/api/analysis/test (requires auth)`);
      console.log(`💡 Note: Some features require MongoDB and Redis to be properly configured`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    await cacheService.close();
    console.log('Cache service closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    await cacheService.close();
    console.log('Cache service closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();