/**
 * Authentication Context
 * Manages user authentication state and provides auth methods to components
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Api from '../Api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accessToken: null,
  refreshToken: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  REFRESH_TOKEN_FAILURE: 'REFRESH_TOKEN_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESTORE_SESSION: 'RESTORE_SESSION'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
        accessToken: null,
        refreshToken: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user || state.user,
        error: null
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_FAILURE:
      return {
        ...initialState,
        isLoading: false,
        error: 'Session expired. Please login again.'
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'devsage_access_token',
  REFRESH_TOKEN: 'devsage_refresh_token',
  USER: 'devsage_user'
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const userData = localStorage.getItem(STORAGE_KEYS.USER);

        if (accessToken && refreshToken && userData) {
          const user = JSON.parse(userData);
          
          // Set token in API headers
          Api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          // Verify token is still valid by fetching user profile
          try {
            const response = await Api.get('/api/auth/me');
            
            dispatch({
              type: AUTH_ACTIONS.RESTORE_SESSION,
              payload: {
                user: response.data.user,
                accessToken,
                refreshToken
              }
            });
          } catch (error) {
            // Token might be expired, try to refresh
            if (error.response?.status === 401) {
              await refreshAccessToken(refreshToken);
            } else {
              // Clear invalid session
              clearAuthData();
              dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Set up API interceptor for token refresh
  useEffect(() => {
    const interceptor = Api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (refreshToken) {
            const success = await refreshAccessToken(refreshToken);
            if (success) {
              // Retry original request with new token
              const newAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              return Api(originalRequest);
            }
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      Api.interceptors.response.eject(interceptor);
    };
  }, []);

  // Helper functions
  const saveAuthData = (user, accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    Api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  };

  const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    delete Api.defaults.headers.common['Authorization'];
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await Api.post('/api/auth/refresh', {
        refreshToken
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response.data;

      saveAuthData(user || state.user, newAccessToken, newRefreshToken);

      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS,
        payload: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user
        }
      });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      dispatch({ type: AUTH_ACTIONS.REFRESH_TOKEN_FAILURE });
      return false;
    }
  };

  // Auth methods
  const login = async (identifier, password, rememberMe = false) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await Api.post('/api/auth/login', {
        identifier,
        password,
        rememberMe
      });

      const { user, accessToken, refreshToken } = response.data;

      saveAuthData(user, accessToken, refreshToken);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user,
          accessToken,
          refreshToken
        }
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      return { 
        success: false, 
        error: errorMessage,
        code: error.response?.data?.code
      };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await Api.post('/api/auth/register', userData);

      const { user, accessToken, refreshToken } = response.data;

      saveAuthData(user, accessToken, refreshToken);

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user,
          accessToken,
          refreshToken
        }
      });

      return { 
        success: true, 
        user,
        verificationRequired: response.data.verificationRequired,
        teamInvitation: response.data.teamInvitation
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage }
      });

      return { 
        success: false, 
        error: errorMessage,
        code: error.response?.data?.code,
        field: error.response?.data?.field
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await Api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthData();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await Api.post('/api/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Password reset request failed';
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await Api.post('/api/auth/reset-password', {
        token,
        password
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Password reset failed';
      return { 
        success: false, 
        error: errorMessage,
        code: error.response?.data?.code
      };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await Api.post('/api/auth/verify-email', { token });
      
      // Update user's email verification status
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { emailVerified: true }
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Email verification failed';
      return { 
        success: false, 
        error: errorMessage,
        code: error.response?.data?.code
      };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await Api.post('/api/auth/resend-verification', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Resend verification failed';
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await Api.put('/api/auth/me', updates);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data.user
      });

      // Update localStorage
      const updatedUser = { ...state.user, ...response.data.user };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const refreshUserData = async () => {
    try {
      const response = await Api.get('/api/auth/me');
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data.user
      });

      // Update localStorage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));

      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return { success: false, error: 'Failed to refresh user data' };
    }
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    accessToken: state.accessToken,

    // Methods
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    updateProfile,
    clearError,
    refreshUserData,

    // Helper methods
    hasPermission: (permission) => {
      return state.user?.status === 'active';
    },
    
    isEmailVerified: () => {
      return state.user?.emailVerified || false;
    },

    getUserTeams: () => {
      return state.user?.teams || [];
    },

    getUserPreferences: () => {
      return state.user?.preferences || {};
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show login form
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default AuthContext;