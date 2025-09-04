/**
 * Socket Context
 * Manages WebSocket connection state and provides real-time functionality
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  isConnected: false,
  connectionStatus: 'disconnected', // disconnected, connecting, connected, reconnecting, error
  notifications: [],
  unreadCount: 0,
  activeAnalyses: new Map(),
  userPresence: new Map(),
  typingUsers: new Set(),
  error: null,
  stats: {
    reconnectAttempts: 0,
    lastConnected: null,
    lastDisconnected: null
  }
};

// Action types
const SOCKET_ACTIONS = {
  CONNECTION_START: 'CONNECTION_START',
  CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  MARK_ALL_NOTIFICATIONS_READ: 'MARK_ALL_NOTIFICATIONS_READ',
  ANALYSIS_STARTED: 'ANALYSIS_STARTED',
  ANALYSIS_PROGRESS: 'ANALYSIS_PROGRESS',
  ANALYSIS_COMPLETE: 'ANALYSIS_COMPLETE',
  ANALYSIS_ERROR: 'ANALYSIS_ERROR',
  ANALYSIS_CANCELLED: 'ANALYSIS_CANCELLED',
  USER_PRESENCE_UPDATE: 'USER_PRESENCE_UPDATE',
  TYPING_START: 'TYPING_START',
  TYPING_STOP: 'TYPING_STOP',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_STATS: 'UPDATE_STATS'
};

// Reducer
const socketReducer = (state, action) => {
  switch (action.type) {
    case SOCKET_ACTIONS.CONNECTION_START:
      return {
        ...state,
        connectionStatus: 'connecting',
        error: null
      };

    case SOCKET_ACTIONS.CONNECTION_SUCCESS:
      return {
        ...state,
        isConnected: true,
        connectionStatus: 'connected',
        error: null,
        stats: {
          ...state.stats,
          lastConnected: new Date().toISOString(),
          reconnectAttempts: 0
        }
      };

    case SOCKET_ACTIONS.CONNECTION_ERROR:
      return {
        ...state,
        isConnected: false,
        connectionStatus: 'error',
        error: action.payload.error,
        stats: {
          ...state.stats,
          reconnectAttempts: state.stats.reconnectAttempts + 1
        }
      };

    case SOCKET_ACTIONS.DISCONNECTED:
      return {
        ...state,
        isConnected: false,
        connectionStatus: 'disconnected',
        stats: {
          ...state.stats,
          lastDisconnected: new Date().toISOString()
        }
      };

    case SOCKET_ACTIONS.RECONNECTING:
      return {
        ...state,
        connectionStatus: 'reconnecting'
      };

    case SOCKET_ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload,
        id: action.payload.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        read: false,
        receivedAt: new Date().toISOString()
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
        unreadCount: state.unreadCount + 1
      };

    case SOCKET_ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload.notificationId
            ? { ...notif, read: true }
            : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case SOCKET_ACTIONS.MARK_ALL_NOTIFICATIONS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notif => ({ ...notif, read: true })),
        unreadCount: 0
      };

    case SOCKET_ACTIONS.ANALYSIS_STARTED:
      const newAnalyses = new Map(state.activeAnalyses);
      newAnalyses.set(action.payload.analysisId, {
        ...action.payload,
        status: 'running',
        progress: 0,
        startedAt: new Date().toISOString()
      });
      
      return {
        ...state,
        activeAnalyses: newAnalyses
      };

    case SOCKET_ACTIONS.ANALYSIS_PROGRESS:
      const progressAnalyses = new Map(state.activeAnalyses);
      const existingAnalysis = progressAnalyses.get(action.payload.analysisId);
      
      if (existingAnalysis) {
        progressAnalyses.set(action.payload.analysisId, {
          ...existingAnalysis,
          ...action.payload,
          status: 'running'
        });
      }
      
      return {
        ...state,
        activeAnalyses: progressAnalyses
      };

    case SOCKET_ACTIONS.ANALYSIS_COMPLETE:
      const completeAnalyses = new Map(state.activeAnalyses);
      const completedAnalysis = completeAnalyses.get(action.payload.analysisId);
      
      if (completedAnalysis) {
        completeAnalyses.set(action.payload.analysisId, {
          ...completedAnalysis,
          ...action.payload,
          status: 'complete',
          progress: 100,
          completedAt: new Date().toISOString()
        });
        
        // Remove after 5 seconds
        setTimeout(() => {
          completeAnalyses.delete(action.payload.analysisId);
        }, 5000);
      }
      
      return {
        ...state,
        activeAnalyses: completeAnalyses
      };

    case SOCKET_ACTIONS.ANALYSIS_ERROR:
      const errorAnalyses = new Map(state.activeAnalyses);
      const errorAnalysis = errorAnalyses.get(action.payload.analysisId);
      
      if (errorAnalysis) {
        errorAnalyses.set(action.payload.analysisId, {
          ...errorAnalysis,
          ...action.payload,
          status: 'error',
          erroredAt: new Date().toISOString()
        });
      }
      
      return {
        ...state,
        activeAnalyses: errorAnalyses
      };

    case SOCKET_ACTIONS.ANALYSIS_CANCELLED:
      const cancelledAnalyses = new Map(state.activeAnalyses);
      cancelledAnalyses.delete(action.payload.analysisId);
      
      return {
        ...state,
        activeAnalyses: cancelledAnalyses
      };

    case SOCKET_ACTIONS.USER_PRESENCE_UPDATE:
      const newPresence = new Map(state.userPresence);
      newPresence.set(action.payload.userId, {
        username: action.payload.username,
        status: action.payload.status,
        lastSeen: action.payload.timestamp
      });
      
      return {
        ...state,
        userPresence: newPresence
      };

    case SOCKET_ACTIONS.TYPING_START:
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.add(action.payload.userId);
      
      return {
        ...state,
        typingUsers: newTypingUsers
      };

    case SOCKET_ACTIONS.TYPING_STOP:
      const updatedTypingUsers = new Set(state.typingUsers);
      updatedTypingUsers.delete(action.payload.userId);
      
      return {
        ...state,
        typingUsers: updatedTypingUsers
      };

    case SOCKET_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case SOCKET_ACTIONS.UPDATE_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      };

    default:
      return state;
  }
};

// Create context
const SocketContext = createContext();

// Socket Provider Component
export const SocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { user, accessToken, isAuthenticated } = useAuth();

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken && !state.isConnected) {
      connectSocket();
    } else if (!isAuthenticated && state.isConnected) {
      disconnectSocket();
    }
  }, [isAuthenticated, accessToken]);

  // Setup socket event listeners
  useEffect(() => {
    if (state.isConnected) {
      setupEventListeners();
    }
    
    return () => {
      cleanupEventListeners();
    };
  }, [state.isConnected]);

  // Connect to socket
  const connectSocket = useCallback(async () => {
    if (!accessToken) return;
    
    dispatch({ type: SOCKET_ACTIONS.CONNECTION_START });
    
    try {
      await socketService.connect(accessToken);
      dispatch({ type: SOCKET_ACTIONS.CONNECTION_SUCCESS });
      
      // Join user room
      socketService.joinUserRoom();
      
      // Join team rooms
      if (user?.teams) {
        user.teams.forEach(teamMembership => {
          if (teamMembership.status === 'active') {
            socketService.joinTeamRoom(teamMembership.team._id);
          }
        });
      }
      
    } catch (error) {
      dispatch({ 
        type: SOCKET_ACTIONS.CONNECTION_ERROR, 
        payload: { error: error.message } 
      });
    }
  }, [accessToken, user]);

  // Disconnect from socket
  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
    dispatch({ type: SOCKET_ACTIONS.DISCONNECTED });
  }, []);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    // Connection events
    socketService.onConnect(() => {
      dispatch({ type: SOCKET_ACTIONS.CONNECTION_SUCCESS });
    });
    
    socketService.onDisconnect((reason) => {
      if (reason === 'io server disconnect') {
        dispatch({ type: SOCKET_ACTIONS.DISCONNECTED });
      } else {
        dispatch({ type: SOCKET_ACTIONS.RECONNECTING });
      }
    });

    // Notification events
    socketService.on('notification_received', (notification) => {
      dispatch({ 
        type: SOCKET_ACTIONS.ADD_NOTIFICATION, 
        payload: notification 
      });
    });

    socketService.on('team_notification_received', (notification) => {
      dispatch({ 
        type: SOCKET_ACTIONS.ADD_NOTIFICATION, 
        payload: { ...notification, type: 'team' } 
      });
    });

    // Code analysis events
    socketService.on('code_analysis_started', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.ANALYSIS_STARTED, 
        payload: data 
      });
    });

    socketService.on('code_analysis_progress', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.ANALYSIS_PROGRESS, 
        payload: data 
      });
    });

    socketService.on('code_analysis_complete', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.ANALYSIS_COMPLETE, 
        payload: data 
      });
    });

    socketService.on('code_analysis_error', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.ANALYSIS_ERROR, 
        payload: data 
      });
    });

    socketService.on('code_analysis_cancelled', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.ANALYSIS_CANCELLED, 
        payload: data 
      });
    });

    // Presence events
    socketService.on('user_presence_update', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.USER_PRESENCE_UPDATE, 
        payload: data 
      });
    });

    // Typing events
    socketService.on('user_typing_start', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.TYPING_START, 
        payload: data 
      });
    });

    socketService.on('user_typing_stop', (data) => {
      dispatch({ 
        type: SOCKET_ACTIONS.TYPING_STOP, 
        payload: data 
      });
    });

    // Error events
    socketService.on('socket_error', (error) => {
      dispatch({ 
        type: SOCKET_ACTIONS.CONNECTION_ERROR, 
        payload: { error: error.message } 
      });
    });
  }, []);

  // Cleanup event listeners
  const cleanupEventListeners = useCallback(() => {
    // Remove all event listeners
    socketService.eventListeners.clear();
  }, []);

  // Public methods
  const startCodeAnalysis = useCallback((data) => {
    socketService.startCodeAnalysis(data);
  }, []);

  const cancelCodeAnalysis = useCallback((analysisId) => {
    socketService.cancelCodeAnalysis(analysisId);
  }, []);

  const markNotificationRead = useCallback((notificationId) => {
    socketService.markNotificationRead(notificationId);
    dispatch({ 
      type: SOCKET_ACTIONS.MARK_NOTIFICATION_READ, 
      payload: { notificationId } 
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    socketService.markAllNotificationsRead();
    dispatch({ type: SOCKET_ACTIONS.MARK_ALL_NOTIFICATIONS_READ });
  }, []);

  const updatePresence = useCallback((status) => {
    socketService.updatePresence(status);
  }, []);

  const joinTeamRoom = useCallback((teamId) => {
    socketService.joinTeamRoom(teamId);
  }, []);

  const leaveTeamRoom = useCallback((teamId) => {
    socketService.leaveTeamRoom(teamId);
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: SOCKET_ACTIONS.CLEAR_ERROR });
  }, []);

  // Context value
  const value = {
    // State
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    activeAnalyses: state.activeAnalyses,
    userPresence: state.userPresence,
    typingUsers: state.typingUsers,
    error: state.error,
    stats: state.stats,

    // Methods
    connectSocket,
    disconnectSocket,
    startCodeAnalysis,
    cancelCodeAnalysis,
    markNotificationRead,
    markAllNotificationsRead,
    updatePresence,
    joinTeamRoom,
    leaveTeamRoom,
    clearError,

    // Utilities
    getConnectionStatus: () => socketService.getConnectionStatus(),
    addEventListener: (event, callback) => socketService.on(event, callback),
    removeEventListener: (event, callback) => socketService.off(event, callback)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

export default SocketContext;