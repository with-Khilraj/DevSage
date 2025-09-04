/**
 * Authentication Middleware
 * JWT-based authentication with comprehensive security features
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const kiroLogger = require('../utils/kiroLogger');

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {Object} payload - Additional payload data
 * @returns {string} - JWT token
 */
const generateToken = (userId, payload = {}) => {
  const jwtPayload = {
    userId,
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    type: 'access'
  };
  
  return jwt.sign(jwtPayload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'devsage',
    audience: 'devsage-users'
  });
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'devsage',
    audience: 'devsage-users'
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token, type = 'access') => {
  const secret = type === 'refresh' 
    ? (process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret')
    : (process.env.JWT_SECRET || 'fallback-secret');
  
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'devsage',
      audience: 'devsage-users'
    });
    
    // Verify token type matches expected
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Extract token from request
 * @param {Object} req - Express request object
 * @returns {string|null} - Extracted token or null
 */
const extractToken = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Check query parameter (for WebSocket connections)
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
};

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token, 'access');
    
    // Find user
    const user = await User.findById(decoded.userId)
      .select('+lastLogin')
      .populate('teams.team', 'name slug');
    
    if (!user) {
      await kiroLogger.logSecurity('invalid_user_token', 'medium', {
        userId: decoded.userId,
        token: token.substring(0, 10) + '...'
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if user account is active
    if (user.status !== 'active') {
      await kiroLogger.logSecurity('inactive_user_access', 'high', {
        userId: user._id,
        status: user.status
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      await kiroLogger.logSecurity('locked_account_access', 'high', {
        userId: user._id,
        lockUntil: user.lockUntil
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        error: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    
    // Log successful authentication
    await kiroLogger.logInteraction('auth', 'authenticate', {
      userId: user._id,
      username: user.username
    }, {
      success: true,
      tokenType: 'access'
    }, 0, {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  } catch (error) {
    await kiroLogger.logError('auth', error, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    // Determine error type and response
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.userId)
      .populate('teams.team', 'name slug');
    
    if (user && user.status === 'active' && !user.isLocked) {
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {Array|string} roles - Required roles
 * @returns {Function} - Express middleware
 */
const authorize = (roles) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // System admin check (if implemented)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // For now, all authenticated users have basic access
    // This can be extended with more granular role checking
    if (requiredRoles.includes('user') || requiredRoles.includes('member')) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles
    });
  };
};

/**
 * Team-based authorization middleware
 * @param {string} permission - Required permission
 * @param {string} teamParam - Request parameter containing team ID/slug
 * @returns {Function} - Express middleware
 */
const authorizeTeam = (permission, teamParam = 'teamId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const teamIdentifier = req.params[teamParam];
    if (!teamIdentifier) {
      return res.status(400).json({
        success: false,
        error: `Team ${teamParam} is required`,
        code: 'TEAM_ID_REQUIRED'
      });
    }
    
    try {
      const Team = require('../models/Team');
      let team;
      
      // Try to find by ID first, then by slug
      if (teamIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
        team = await Team.findById(teamIdentifier);
      } else {
        team = await Team.findBySlug(teamIdentifier);
      }
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found',
          code: 'TEAM_NOT_FOUND'
        });
      }
      
      // Check if user has permission
      if (!team.hasPermission(req.user._id, permission)) {
        await kiroLogger.logSecurity('unauthorized_team_access', 'medium', {
          userId: req.user._id,
          teamId: team._id,
          permission,
          userRole: team.getMember(req.user._id)?.role || 'none'
        }, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient team permissions',
          code: 'INSUFFICIENT_TEAM_PERMISSIONS',
          requiredPermission: permission
        });
      }
      
      // Attach team to request
      req.team = team;
      req.userTeamRole = team.getMember(req.user._id)?.role;
      
      next();
    } catch (error) {
      await kiroLogger.logError('auth', error, {
        userId: req.user._id,
        teamIdentifier,
        permission
      });
      
      return res.status(500).json({
        success: false,
        error: 'Team authorization failed',
        code: 'TEAM_AUTH_FAILED'
      });
    }
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 * @param {number} maxAttempts - Maximum attempts per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} - Express middleware
 */
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(ip);
      }
    }
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000);
      
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: timeLeft
      });
    }
    
    userAttempts.count++;
    next();
  };
};

/**
 * Refresh token middleware
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }
    
    const decoded = verifyToken(token, 'refresh');
    const user = await User.findById(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    // Generate new tokens
    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    await kiroLogger.logError('auth', error, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      success: false,
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  extractToken,
  authenticate,
  optionalAuth,
  authorize,
  authorizeTeam,
  authRateLimit,
  refreshToken
};