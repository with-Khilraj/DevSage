/**
 * Client-side Socket Service
 * Manages WebSocket connection and real-time events
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
    this.connectionCallbacks = [];
    this.disconnectionCallbacks = [];
  }

  /**
   * Initialize socket connection
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      
      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      // Connection successful
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Execute connection callbacks
        this.connectionCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Connection callback error:', error);
          }
        });
        
        resolve();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
        }
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
        
        // Execute disconnection callbacks
        this.disconnectionCallbacks.forEach(callback => {
          try {
            callback(reason);
          } catch (error) {
            console.error('Disconnection callback error:', error);
          }
        });
      });

      // Reconnection attempt
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Reconnection attempt ${attemptNumber}`);
        this.reconnectAttempts = attemptNumber;
      });

      // Reconnection successful
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`Reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      // Setup default event handlers
      this.setupDefaultHandlers();
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Setup default event handlers
   */
  setupDefaultHandlers() {
    // Connection confirmation
    this.socket.on('connected', (data) => {
      console.log('Connection confirmed:', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket_error', error);
    });

    // Room events
    this.socket.on('joined_room', (data) => {
      console.log('Joined room:', data);
      this.emit('room_joined', data);
    });

    this.socket.on('left_room', (data) => {
      console.log('Left room:', data);
      this.emit('room_left', data);
    });

    // Notification events
    this.socket.on('notification', (notification) => {
      this.emit('notification_received', notification);
    });

    this.socket.on('team_notification', (notification) => {
      this.emit('team_notification_received', notification);
    });

    // Code analysis events
    this.socket.on('code_analysis_started', (data) => {
      this.emit('code_analysis_started', data);
    });

    this.socket.on('code_analysis_progress', (data) => {
      this.emit('code_analysis_progress', data);
    });

    this.socket.on('code_analysis_complete', (data) => {
      this.emit('code_analysis_complete', data);
    });

    this.socket.on('code_analysis_error', (data) => {
      this.emit('code_analysis_error', data);
    });

    this.socket.on('code_analysis_cancelled', (data) => {
      this.emit('code_analysis_cancelled', data);
    });

    // Team code analysis
    this.socket.on('team_code_analysis', (data) => {
      this.emit('team_code_analysis', data);
    });

    // Presence events
    this.socket.on('user_presence_update', (data) => {
      this.emit('user_presence_update', data);
    });

    // Typing indicators
    this.socket.on('user_typing_start', (data) => {
      this.emit('user_typing_start', data);
    });

    this.socket.on('user_typing_stop', (data) => {
      this.emit('user_typing_stop', data);
    });
  }

  /**
   * Join user's personal room
   */
  joinUserRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_user_room');
    }
  }

  /**
   * Join team room
   * @param {string} teamId - Team ID to join
   */
  joinTeamRoom(teamId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_team_room', teamId);
    }
  }

  /**
   * Leave team room
   * @param {string} teamId - Team ID to leave
   */
  leaveTeamRoom(teamId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_team_room', teamId);
    }
  }

  /**
   * Start code analysis
   * @param {Object} data - Analysis data
   */
  startCodeAnalysis(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('start_code_analysis', data);
    }
  }

  /**
   * Cancel code analysis
   * @param {string} analysisId - Analysis ID to cancel
   */
  cancelCodeAnalysis(analysisId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('cancel_code_analysis', analysisId);
    }
  }

  /**
   * Update user presence
   * @param {string} status - Presence status (online, away, busy, offline)
   */
  updatePresence(status) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_presence', status);
    }
  }

  /**
   * Start typing indicator
   * @param {Object} data - Typing context
   */
  startTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', data);
    }
  }

  /**
   * Stop typing indicator
   * @param {Object} data - Typing context
   */
  stopTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', data);
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markNotificationRead(notificationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_notification_read', notificationId);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead() {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_all_notifications_read');
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Add connection callback
   * @param {Function} callback - Callback to execute on connection
   */
  onConnect(callback) {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Add disconnection callback
   * @param {Function} callback - Callback to execute on disconnection
   */
  onDisconnect(callback) {
    this.disconnectionCallbacks.push(callback);
  }

  /**
   * Get connection status
   * @returns {boolean} - Connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      transport: this.socket?.io?.engine?.transport?.name
    };
  }

  /**
   * Get socket instance (for advanced usage)
   * @returns {Socket} - Socket.io client instance
   */
  getSocket() {
    return this.socket;
  }
}

// Create and export singleton instance
const socketService = new SocketService();
export default socketService;