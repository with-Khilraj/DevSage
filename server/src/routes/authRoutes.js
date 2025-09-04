/**
 * Authentication Routes
 * Handles user registration, login, password reset, and OAuth integration
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Team = require('../models/Team');
const { 
  generateToken, 
  generateRefreshToken, 
  authenticate, 
  authRateLimit,
  refreshToken
} = require('../middleware/auth');
const kiroLogger = require('../utils/kiroLogger');

const router = express.Router();

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { 
      email, 
      username, 
      password, 
      firstName, 
      lastName, 
      invitationToken 
    } = req.body;

    // Validation
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    if (!username || !validateUsername(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens',
        code: 'INVALID_USERNAME'
      });
    }

    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
        code: 'INVALID_PASSWORD'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(409).json({
        success: false,
        error: `User with this ${field} already exists`,
        code: 'USER_EXISTS',
        field
      });
    }

    // Create user
    const userData = {
      email: email.toLowerCase(),
      username,
      password,
      profile: {
        firstName: firstName || '',
        lastName: lastName || ''
      }
    };

    const user = new User(userData);
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Handle team invitation if provided
    let teamInvitation = null;
    if (invitationToken) {
      try {
        const team = await Team.findByInvitationToken(invitationToken);
        if (team) {
          team.acceptInvitation(invitationToken, user._id);
          await team.save();
          teamInvitation = {
            teamName: team.name,
            teamSlug: team.slug
          };
        }
      } catch (error) {
        console.warn('Failed to process team invitation:', error.message);
      }
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshTokenValue = generateRefreshToken(user._id);

    // Log successful registration
    await kiroLogger.logInteraction('auth', 'register', {
      email: email.toLowerCase(),
      username
    }, {
      success: true,
      userId: user._id,
      teamInvitation: !!teamInvitation
    }, 0, {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        emailVerified: user.emailVerified
      },
      accessToken,
      refreshToken: refreshTokenValue,
      teamInvitation,
      verificationRequired: !user.emailVerified
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      email: req.body.email,
      username: req.body.username,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email or username
    const user = await User.findByIdentifier(identifier)
      .select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      await kiroLogger.logSecurity('locked_account_login_attempt', 'medium', {
        userId: user._id,
        identifier
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.handleFailedLogin();
      
      await kiroLogger.logSecurity('failed_login_attempt', 'low', {
        userId: user._id,
        identifier,
        attempts: user.loginAttempts + 1
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE',
        status: user.status
      });
    }

    // Handle successful login
    await user.handleSuccessfulLogin();

    // Generate tokens
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const accessToken = generateToken(user._id, { rememberMe });
    const refreshTokenValue = generateRefreshToken(user._id);

    // Populate user teams
    await user.populate('teams.team', 'name slug');

    // Log successful login
    await kiroLogger.logInteraction('auth', 'login', {
      identifier,
      rememberMe: !!rememberMe
    }, {
      success: true,
      userId: user._id,
      tokenExpiry
    }, 0, {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        emailVerified: user.emailVerified,
        teams: user.teams,
        preferences: user.preferences,
        stats: user.stats
      },
      accessToken,
      refreshToken: refreshTokenValue
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      identifier: req.body.identifier,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a production app, you'd want to blacklist the token
    // For now, we'll just log the logout
    
    await kiroLogger.logInteraction('auth', 'logout', {
      userId: req.user._id
    }, {
      success: true
    }, 0, {
      userId: req.user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      userId: req.user?._id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', refreshToken);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', authRateLimit(3, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      status: 'active'
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send password reset email
    console.log(`Password reset token for ${email}: ${resetToken}`);

    await kiroLogger.logInteraction('auth', 'forgot_password', {
      email: email.toLowerCase()
    }, {
      success: true,
      userId: user._id
    }, 0, {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      email: req.body.email,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Password reset request failed',
      code: 'FORGOT_PASSWORD_FAILED'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', authRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
        code: 'INVALID_PASSWORD'
      });
    }

    const user = await User.findByPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = undefined;
    user.lockUntil = undefined;

    await user.save();

    await kiroLogger.logInteraction('auth', 'reset_password', {
      userId: user._id
    }, {
      success: true
    }, 0, {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Password reset failed',
      code: 'RESET_PASSWORD_FAILED'
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const user = await User.findByVerificationToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    await kiroLogger.logInteraction('auth', 'verify_email', {
      userId: user._id
    }, {
      success: true
    }, 0, {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Email verification failed',
      code: 'VERIFICATION_FAILED'
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification
 */
router.post('/resend-verification', authRateLimit(3, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      status: 'active'
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists and is unverified, a verification email has been sent'
      });
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // TODO: Send verification email
    console.log(`New verification token for ${email}: ${verificationToken}`);

    res.json({
      success: true,
      message: 'If an account with that email exists and is unverified, a verification email has been sent'
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      email: req.body.email,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Resend verification failed',
      code: 'RESEND_VERIFICATION_FAILED'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    await req.user.populate('teams.team', 'name slug');

    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profile: req.user.profile,
        emailVerified: req.user.emailVerified,
        teams: req.user.teams,
        preferences: req.user.preferences,
        stats: req.user.stats,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin
      }
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      userId: req.user._id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const allowedUpdates = [
      'profile.firstName',
      'profile.lastName', 
      'profile.displayName',
      'profile.bio',
      'profile.jobTitle',
      'profile.company',
      'profile.location',
      'profile.website',
      'profile.technologies',
      'preferences'
    ];

    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided',
        code: 'NO_UPDATES'
      });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (!req.user[parent]) req.user[parent] = {};
        req.user[parent][child] = updates[key];
      } else {
        req.user[key] = updates[key];
      }
    });

    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profile: req.user.profile,
        preferences: req.user.preferences
      }
    });

  } catch (error) {
    await kiroLogger.logError('auth', error, {
      userId: req.user._id,
      updates: Object.keys(req.body)
    });

    res.status(500).json({
      success: false,
      error: 'Profile update failed',
      code: 'PROFILE_UPDATE_FAILED'
    });
  }
});

module.exports = router;