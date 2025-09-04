/**
 * Socket Service
 * Real-time communication service using Socket.io
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const kiroLogger = require('../utils/kiroLogger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket info
    this.userSockets = new Map(); // socketId -> user info
    this.rooms = new Map(); // roomId -> Set of socketIds
  }

  /**
   * Initialize Socket.io server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('Socket.io server initialized');
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        // Find user
        const user = await User.findById(decoded.userId)
          .populate('teams.team', 'name slug');
        
        if (!user || user.status !== 'active') {
          return next(new Error('Invalid user or inactive account'));
        }

        // Attach user to socket
        socket.userId = user._id.toString();
        socket.user = user;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      // User events
      socket.on('join_user_room', () => this.handleJoinUserRoom(socket));
      socket.on('join_team_room', (teamId) => this.handleJoinTeamRoom(socket, teamId));
      socket.on('leave_team_room', (teamId) => this.handleLeaveTeamRoom(socket, teamId));
      
      // Code analysis events
      socket.on('start_code_analysis', (data) => this.handleStartCodeAnalysis(socket, data));
      socket.on('cancel_code_analysis', (analysisId) => this.handleCancelCodeAnalysis(socket, analysisId));
      
      // Notification events
      socket.on('mark_notification_read', (notificationId) => this.handleMarkNotificationRead(socket, notificationId));
      socket.on('mark_all_notifications_read', () => this.handleMarkAllNotificationsRead(socket));
      
      // Typing indicators
      socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
      
      // Presence events
      socket.on('update_presence', (status) => this.handleUpdatePresence(socket, status));
      
      // Disconnect handler
      socket.on('disconnect', () => this.handleDisconnection(socket));
    });
  }

  /**
   * Handle new connection
   */
  async handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;
    
    // Store connection info
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      user: user,
      connectedAt: new Date(),
      status: 'online',
      currentRoom: null
    });
    
    this.userSockets.set(socket.id, {
      userId: userId,
      user: user
    });

    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Join team rooms
    if (user.teams && user.teams.length > 0) {
      user.teams.forEach(teamMembership => {
        if (teamMembership.status === 'active') {
          socket.join(`team:${teamMembership.team._id}`);
        }
      });
    }

    // Log connection
    await kiroLogger.logInteraction('socket', 'connect', {
      userId: userId,
      username: user.username
    }, {
      success: true,
      socketId: socket.id
    }, 0, {
      userId: userId,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent']
    });

    // Notify user of successful connection
    socket.emit('connected', {
      userId: userId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Broadcast user online status to teams
    this.broadcastUserPresence(userId, 'online');

    console.log(`User ${user.username} connected (${socket.id})`);
  }

  /**
   * Handle disconnection
   */
  async handleDisconnection(socket) {
    const socketInfo = this.userSockets.get(socket.id);
    
    if (socketInfo) {
      const { userId, user } = socketInfo;
      
      // Remove from maps
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);
      
      // Broadcast user offline status
      this.broadcastUserPresence(userId, 'offline');
      
      // Log disconnection
      await kiroLogger.logInteraction('socket', 'disconnect', {
        userId: userId,
        username: user.username
      }, {
        success: true,
        socketId: socket.id
      }, 0, {
        userId: userId
      });

      console.log(`User ${user.username} disconnected (${socket.id})`);
    }
  }

  /**
   * Handle joining user room
   */
  handleJoinUserRoom(socket) {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    socket.emit('joined_room', { room: `user:${userId}`, type: 'user' });
  }

  /**
   * Handle joining team room
   */
  handleJoinTeamRoom(socket, teamId) {
    const user = socket.user;
    
    // Check if user is member of the team
    const teamMembership = user.teams.find(t => 
      t.team._id.toString() === teamId && t.status === 'active'
    );
    
    if (teamMembership) {
      socket.join(`team:${teamId}`);
      socket.emit('joined_room', { room: `team:${teamId}`, type: 'team' });
      
      // Update current room
      const userConnection = this.connectedUsers.get(socket.userId);
      if (userConnection) {
        userConnection.currentRoom = `team:${teamId}`;
      }
    } else {
      socket.emit('error', { message: 'Not authorized to join this team room' });
    }
  }

  /**
   * Handle leaving team room
   */
  handleLeaveTeamRoom(socket, teamId) {
    socket.leave(`team:${teamId}`);
    socket.emit('left_room', { room: `team:${teamId}`, type: 'team' });
    
    // Clear current room if it matches
    const userConnection = this.connectedUsers.get(socket.userId);
    if (userConnection && userConnection.currentRoom === `team:${teamId}`) {
      userConnection.currentRoom = null;
    }
  }

  /**
   * Handle start code analysis
   */
  async handleStartCodeAnalysis(socket, data) {
    const { filePath, codeContent, options = {} } = data;
    const userId = socket.userId;
    
    try {
      // Generate analysis ID
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Emit analysis started event
      socket.emit('code_analysis_started', {
        analysisId,
        filePath,
        timestamp: new Date().toISOString()
      });
      
      // Log analysis start
      await kiroLogger.logInteraction('socket', 'code_analysis_start', {
        userId: userId,
        filePath: filePath,
        analysisId: analysisId
      }, {
        success: true
      }, 0, {
        userId: userId
      });
      
      // Here you would integrate with your KiroCodeAnalyzer
      // For now, we'll simulate the analysis process
      this.simulateCodeAnalysis(socket, analysisId, filePath, codeContent, options);
      
    } catch (error) {
      socket.emit('code_analysis_error', {
        error: error.message,
        filePath
      });
    }
  }

  /**
   * Simulate code analysis (replace with actual KiroCodeAnalyzer integration)
   */
  async simulateCodeAnalysis(socket, analysisId, filePath, codeContent, options) {
    // Simulate analysis progress
    const steps = [
      { step: 'parsing', progress: 20, message: 'Parsing code structure...' },
      { step: 'security', progress: 40, message: 'Analyzing security patterns...' },
      { step: 'performance', progress: 60, message: 'Checking performance optimizations...' },
      { step: 'maintainability', progress: 80, message: 'Evaluating maintainability...' },
      { step: 'complete', progress: 100, message: 'Analysis complete!' }
    ];
    
    for (const stepData of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      socket.emit('code_analysis_progress', {
        analysisId,
        filePath,
        ...stepData,
        timestamp: new Date().toISOString()
      });
    }
    
    // Emit final results
    const mockResults = {
      analysisId,
      filePath,
      qualityScore: 85,
      suggestions: [
        {
          id: 'suggestion_1',
          type: 'security',
          severity: 'medium',
          line: 15,
          message: 'Consider input validation for user data',
          suggestedFix: 'Add proper validation before processing user input'
        },
        {
          id: 'suggestion_2',
          type: 'performance',
          severity: 'low',
          line: 23,
          message: 'Consider using const instead of let for immutable variables',
          suggestedFix: 'Change let to const for variables that are not reassigned'
        }
      ],
      timestamp: new Date().toISOString()
    };
    
    socket.emit('code_analysis_complete', mockResults);
  }

  /**
   * Handle cancel code analysis
   */
  handleCancelCodeAnalysis(socket, analysisId) {
    // Here you would cancel the actual analysis
    socket.emit('code_analysis_cancelled', {
      analysisId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle typing indicators
   */
  handleTypingStart(socket, data) {
    const { room, context } = data;
    socket.to(room).emit('user_typing_start', {
      userId: socket.userId,
      username: socket.user.username,
      context,
      timestamp: new Date().toISOString()
    });
  }

  handleTypingStop(socket, data) {
    const { room, context } = data;
    socket.to(room).emit('user_typing_stop', {
      userId: socket.userId,
      username: socket.user.username,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle presence updates
   */
  handleUpdatePresence(socket, status) {
    const userId = socket.userId;
    const userConnection = this.connectedUsers.get(userId);
    
    if (userConnection) {
      userConnection.status = status;
      this.broadcastUserPresence(userId, status);
    }
  }

  /**
   * Handle notification read status
   */
  handleMarkNotificationRead(socket, notificationId) {
    // Here you would update the notification in the database
    socket.emit('notification_marked_read', {
      notificationId,
      timestamp: new Date().toISOString()
    });
  }

  handleMarkAllNotificationsRead(socket) {
    // Here you would mark all notifications as read in the database
    socket.emit('all_notifications_marked_read', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast user presence to teams
   */
  broadcastUserPresence(userId, status) {
    const userConnection = this.connectedUsers.get(userId);
    if (!userConnection) return;
    
    const user = userConnection.user;
    
    // Broadcast to all team rooms the user is part of
    if (user.teams && user.teams.length > 0) {
      user.teams.forEach(teamMembership => {
        if (teamMembership.status === 'active') {
          this.io.to(`team:${teamMembership.team._id}`).emit('user_presence_update', {
            userId: userId,
            username: user.username,
            status: status,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  }

  // Public methods for other services to use

  /**
   * Send notification to user
   */
  sendNotificationToUser(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send notification to team
   */
  sendNotificationToTeam(teamId, notification) {
    this.io.to(`team:${teamId}`).emit('team_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast code analysis result to team
   */
  broadcastCodeAnalysisToTeam(teamId, analysisResult) {
    this.io.to(`team:${teamId}`).emit('team_code_analysis', {
      ...analysisResult,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send real-time update to user
   */
  sendUpdateToUser(userId, eventType, data) {
    this.io.to(`user:${userId}`).emit(eventType, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get user connection status
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get connected users in team
   */
  getConnectedTeamMembers(teamId) {
    const connectedMembers = [];
    
    this.connectedUsers.forEach((connection, userId) => {
      const user = connection.user;
      if (user.teams && user.teams.some(t => 
        t.team._id.toString() === teamId && t.status === 'active'
      )) {
        connectedMembers.push({
          userId: userId,
          username: user.username,
          status: connection.status,
          connectedAt: connection.connectedAt
        });
      }
    });
    
    return connectedMembers;
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalRooms: this.io.sockets.adapter.rooms.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SocketService();