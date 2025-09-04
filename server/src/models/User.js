/**
 * User Model
 * MongoDB schema for user authentication and profile management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    avatar: {
      type: String, // URL to avatar image
      default: null
    },
    bio: {
      type: String,
      maxlength: 500
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100
    },
    company: {
      type: String,
      trim: true,
      maxlength: 100
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200
    },
    technologies: [{
      type: String,
      trim: true,
      maxlength: 50
    }]
  },

  // Authentication & Security
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },

  // OAuth Integrations
  oauthProviders: {
    github: {
      id: String,
      username: String,
      accessToken: {
        type: String,
        select: false
      },
      refreshToken: {
        type: String,
        select: false
      },
      connectedAt: Date
    },
    gitlab: {
      id: String,
      username: String,
      accessToken: {
        type: String,
        select: false
      },
      refreshToken: {
        type: String,
        select: false
      },
      connectedAt: Date
    },
    bitbucket: {
      id: String,
      username: String,
      accessToken: {
        type: String,
        select: false
      },
      refreshToken: {
        type: String,
        select: false
      },
      connectedAt: Date
    }
  },

  // User Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      codeAnalysis: {
        type: Boolean,
        default: true
      },
      teamUpdates: {
        type: Boolean,
        default: true
      }
    },
    kiroAI: {
      autoAnalyze: {
        type: Boolean,
        default: true
      },
      confidenceThreshold: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.7
      },
      suggestionTypes: {
        security: { type: Boolean, default: true },
        performance: { type: Boolean, default: true },
        maintainability: { type: Boolean, default: true },
        style: { type: Boolean, default: false }
      },
      commitStyle: {
        type: String,
        enum: ['conventional', 'descriptive', 'minimal'],
        default: 'conventional'
      }
    },
    dashboard: {
      layout: {
        type: String,
        enum: ['grid', 'list', 'compact'],
        default: 'grid'
      },
      widgets: [{
        type: String,
        position: Number,
        visible: Boolean
      }]
    }
  },

  // Team Associations
  teams: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: [{
      type: String
    }]
  }],

  // Activity Tracking
  stats: {
    totalCommits: {
      type: Number,
      default: 0
    },
    totalPRs: {
      type: Number,
      default: 0
    },
    codeQualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    suggestionsAccepted: {
      type: Number,
      default: 0
    },
    suggestionsRejected: {
      type: Number,
      default: 0
    },
    lastAnalysis: {
      type: Date
    }
  },

  // System Fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.twoFactorSecret;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'teams.team': 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.displayName || this.username;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Hash password if modified
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  // Set display name if not provided
  if (!this.profile.displayName) {
    this.profile.displayName = this.profile.fullName || this.username;
  }
  
  next();
});

// Instance Methods

/**
 * Compare password with hash
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate email verification token
 * @returns {string} - Verification token
 */
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

/**
 * Generate password reset token
 * @returns {string} - Reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

/**
 * Verify email verification token
 * @param {string} token - Token to verify
 * @returns {boolean} - True if token is valid
 */
userSchema.methods.verifyEmailToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.emailVerificationToken === hashedToken && 
         this.emailVerificationExpires > Date.now();
};

/**
 * Verify password reset token
 * @param {string} token - Token to verify
 * @returns {boolean} - True if token is valid
 */
userSchema.methods.verifyPasswordResetToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.passwordResetToken === hashedToken && 
         this.passwordResetExpires > Date.now();
};

/**
 * Handle failed login attempt
 */
userSchema.methods.handleFailedLogin = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have max attempts and no lock, lock account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

/**
 * Handle successful login
 */
userSchema.methods.handleSuccessfulLogin = async function() {
  // If we have attempts or lock, remove them
  if (this.loginAttempts || this.lockUntil) {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 },
      $set: { lastLogin: Date.now() }
    });
  }
  
  return this.updateOne({ $set: { lastLogin: Date.now() } });
};

/**
 * Check if user has permission
 * @param {string} permission - Permission to check
 * @param {string} teamId - Team ID (optional)
 * @returns {boolean} - True if user has permission
 */
userSchema.methods.hasPermission = function(permission, teamId = null) {
  if (teamId) {
    const teamMembership = this.teams.find(t => t.team.toString() === teamId);
    if (!teamMembership) return false;
    
    // Check role-based permissions
    const rolePermissions = {
      owner: ['*'],
      admin: ['read', 'write', 'manage_members', 'manage_settings'],
      member: ['read', 'write'],
      viewer: ['read']
    };
    
    const userPermissions = rolePermissions[teamMembership.role] || [];
    return userPermissions.includes('*') || 
           userPermissions.includes(permission) ||
           teamMembership.permissions.includes(permission);
  }
  
  // Global permissions (for system-wide features)
  return this.status === 'active';
};

/**
 * Get user's teams with populated data
 * @returns {Promise<Array>} - User's teams
 */
userSchema.methods.getTeams = function() {
  return this.populate('teams.team').execPopulate();
};

/**
 * Encrypt OAuth token
 * @param {string} token - Token to encrypt
 * @returns {string} - Encrypted token
 */
userSchema.methods.encryptToken = function(token) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'fallback-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from(this._id.toString()));
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt OAuth token
 * @param {string} encryptedToken - Encrypted token
 * @returns {string} - Decrypted token
 */
userSchema.methods.decryptToken = function(encryptedToken) {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'fallback-key', 'salt', 32);
    
    const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from(this._id.toString()));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
};

// Static Methods

/**
 * Find user by email or username
 * @param {string} identifier - Email or username
 * @returns {Promise<User>} - User document
 */
userSchema.statics.findByIdentifier = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ],
    status: { $ne: 'deleted' }
  });
};

/**
 * Find user by verification token
 * @param {string} token - Verification token
 * @returns {Promise<User>} - User document
 */
userSchema.statics.findByVerificationToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
    status: { $ne: 'deleted' }
  });
};

/**
 * Find user by password reset token
 * @param {string} token - Reset token
 * @returns {Promise<User>} - User document
 */
userSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    status: { $ne: 'deleted' }
  });
};

module.exports = mongoose.model('User', userSchema);