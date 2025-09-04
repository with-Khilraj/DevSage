/**
 * Team Model
 * MongoDB schema for team management and collaboration
 */

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String, // URL to team avatar
    default: null
  },
  website: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // Team Settings
  settings: {
    visibility: {
      type: String,
      enum: ['public', 'private', 'internal'],
      default: 'private'
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 50,
      min: 1,
      max: 1000
    },
    codingStandards: {
      eslintConfig: {
        type: String,
        default: 'recommended'
      },
      prettierConfig: {
        type: Object,
        default: {}
      },
      customRules: [{
        name: String,
        description: String,
        severity: {
          type: String,
          enum: ['error', 'warning', 'info'],
          default: 'warning'
        },
        enabled: {
          type: Boolean,
          default: true
        }
      }]
    },
    kiroAI: {
      enabled: {
        type: Boolean,
        default: true
      },
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
        style: { type: Boolean, default: true }
      },
      teamInsights: {
        type: Boolean,
        default: true
      }
    }
  },

  // Members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    permissions: [{
      type: String
    }],
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    }
  }],

  // Repositories
  repositories: [{
    platform: {
      type: String,
      enum: ['github', 'gitlab', 'bitbucket', 'local'],
      required: true
    },
    repositoryId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    fullName: {
      type: String, // e.g., "owner/repo"
      required: true
    },
    url: {
      type: String,
      required: true
    },
    defaultBranch: {
      type: String,
      default: 'main'
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    language: {
      type: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastSync: {
      type: Date
    },
    syncStatus: {
      type: String,
      enum: ['synced', 'syncing', 'error', 'never'],
      default: 'never'
    }
  }],

  // Invitations
  invitations: [{
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
    },
    token: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    }
  }],

  // Analytics & Stats
  stats: {
    totalCommits: {
      type: Number,
      default: 0
    },
    totalPRs: {
      type: Number,
      default: 0
    },
    averageCodeQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    activeMembersCount: {
      type: Number,
      default: 0
    },
    repositoriesCount: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date
    }
  },

  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'active'
    },
    currentPeriodStart: {
      type: Date
    },
    currentPeriodEnd: {
      type: Date
    },
    stripeCustomerId: {
      type: String
    },
    stripeSubscriptionId: {
      type: String
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
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
teamSchema.index({ slug: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ createdAt: -1 });
teamSchema.index({ 'repositories.platform': 1, 'repositories.repositoryId': 1 });

// Virtuals
teamSchema.virtual('memberCount').get(function() {
  return this.members.filter(m => m.status === 'active').length;
});

teamSchema.virtual('ownerCount').get(function() {
  return this.members.filter(m => m.role === 'owner' && m.status === 'active').length;
});

teamSchema.virtual('adminCount').get(function() {
  return this.members.filter(m => m.role === 'admin' && m.status === 'active').length;
});

// Pre-save middleware
teamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update stats
  this.stats.activeMembersCount = this.memberCount;
  this.stats.repositoriesCount = this.repositories.length;
  
  next();
});

// Instance Methods

/**
 * Check if user is a member of the team
 * @param {string} userId - User ID to check
 * @returns {Object|null} - Member object or null
 */
teamSchema.methods.getMember = function(userId) {
  return this.members.find(m => 
    m.user.toString() === userId.toString() && 
    m.status === 'active'
  );
};

/**
 * Check if user has specific role
 * @param {string} userId - User ID to check
 * @param {string} role - Role to check
 * @returns {boolean} - True if user has role
 */
teamSchema.methods.hasRole = function(userId, role) {
  const member = this.getMember(userId);
  return member && member.role === role;
};

/**
 * Check if user has permission
 * @param {string} userId - User ID to check
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
teamSchema.methods.hasPermission = function(userId, permission) {
  const member = this.getMember(userId);
  if (!member) return false;
  
  // Role-based permissions
  const rolePermissions = {
    owner: ['*'],
    admin: ['read', 'write', 'manage_members', 'manage_settings', 'manage_repositories'],
    member: ['read', 'write', 'view_analytics'],
    viewer: ['read']
  };
  
  const userPermissions = rolePermissions[member.role] || [];
  return userPermissions.includes('*') || 
         userPermissions.includes(permission) ||
         member.permissions.includes(permission);
};

/**
 * Add member to team
 * @param {string} userId - User ID to add
 * @param {string} role - Role to assign
 * @param {string} invitedBy - User ID who invited
 * @returns {Object} - Added member
 */
teamSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    if (existingMember.status === 'active') {
      throw new Error('User is already a member of this team');
    } else {
      // Reactivate existing member
      existingMember.status = 'active';
      existingMember.role = role;
      existingMember.joinedAt = new Date();
      return existingMember;
    }
  }
  
  const newMember = {
    user: userId,
    role,
    invitedBy,
    joinedAt: new Date(),
    status: 'active'
  };
  
  this.members.push(newMember);
  return newMember;
};

/**
 * Remove member from team
 * @param {string} userId - User ID to remove
 * @returns {boolean} - True if member was removed
 */
teamSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(m => 
    m.user.toString() === userId.toString()
  );
  
  if (memberIndex === -1) return false;
  
  // Don't allow removing the last owner
  if (this.members[memberIndex].role === 'owner' && this.ownerCount <= 1) {
    throw new Error('Cannot remove the last owner of the team');
  }
  
  this.members.splice(memberIndex, 1);
  return true;
};

/**
 * Update member role
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role to assign
 * @returns {boolean} - True if role was updated
 */
teamSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.getMember(userId);
  if (!member) return false;
  
  // Don't allow changing the last owner
  if (member.role === 'owner' && newRole !== 'owner' && this.ownerCount <= 1) {
    throw new Error('Cannot change role of the last owner');
  }
  
  member.role = newRole;
  return true;
};

/**
 * Add repository to team
 * @param {Object} repoData - Repository data
 * @param {string} addedBy - User ID who added the repo
 * @returns {Object} - Added repository
 */
teamSchema.methods.addRepository = function(repoData, addedBy) {
  // Check if repository already exists
  const existingRepo = this.repositories.find(r => 
    r.platform === repoData.platform && 
    r.repositoryId === repoData.repositoryId
  );
  
  if (existingRepo) {
    throw new Error('Repository is already added to this team');
  }
  
  const newRepo = {
    ...repoData,
    addedBy,
    addedAt: new Date(),
    syncStatus: 'never'
  };
  
  this.repositories.push(newRepo);
  return newRepo;
};

/**
 * Remove repository from team
 * @param {string} repositoryId - Repository ID to remove
 * @param {string} platform - Platform of the repository
 * @returns {boolean} - True if repository was removed
 */
teamSchema.methods.removeRepository = function(repositoryId, platform) {
  const repoIndex = this.repositories.findIndex(r => 
    r.repositoryId === repositoryId && r.platform === platform
  );
  
  if (repoIndex === -1) return false;
  
  this.repositories.splice(repoIndex, 1);
  return true;
};

/**
 * Create invitation
 * @param {string} email - Email to invite
 * @param {string} role - Role to assign
 * @param {string} invitedBy - User ID who sent invitation
 * @returns {Object} - Created invitation
 */
teamSchema.methods.createInvitation = function(email, role, invitedBy) {
  // Check if user is already a member
  const existingMember = this.members.find(m => 
    m.user && m.user.email === email.toLowerCase()
  );
  
  if (existingMember && existingMember.status === 'active') {
    throw new Error('User is already a member of this team');
  }
  
  // Check if invitation already exists
  const existingInvitation = this.invitations.find(i => 
    i.email === email.toLowerCase() && 
    i.status === 'pending' &&
    i.expiresAt > new Date()
  );
  
  if (existingInvitation) {
    throw new Error('Invitation already sent to this email');
  }
  
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  const invitation = {
    email: email.toLowerCase(),
    role,
    invitedBy,
    token,
    invitedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: 'pending'
  };
  
  this.invitations.push(invitation);
  return invitation;
};

/**
 * Accept invitation
 * @param {string} token - Invitation token
 * @param {string} userId - User ID accepting the invitation
 * @returns {Object} - Accepted invitation
 */
teamSchema.methods.acceptInvitation = function(token, userId) {
  const invitation = this.invitations.find(i => 
    i.token === token && 
    i.status === 'pending' &&
    i.expiresAt > new Date()
  );
  
  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }
  
  // Add user as member
  this.addMember(userId, invitation.role, invitation.invitedBy);
  
  // Mark invitation as accepted
  invitation.status = 'accepted';
  
  return invitation;
};

// Static Methods

/**
 * Find team by slug
 * @param {string} slug - Team slug
 * @returns {Promise<Team>} - Team document
 */
teamSchema.statics.findBySlug = function(slug) {
  return this.findOne({ 
    slug: slug.toLowerCase(),
    status: { $ne: 'deleted' }
  });
};

/**
 * Find teams for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of teams
 */
teamSchema.statics.findForUser = function(userId) {
  return this.find({
    'members.user': userId,
    'members.status': 'active',
    status: { $ne: 'deleted' }
  }).populate('members.user', 'username email profile');
};

/**
 * Find team by invitation token
 * @param {string} token - Invitation token
 * @returns {Promise<Team>} - Team document
 */
teamSchema.statics.findByInvitationToken = function(token) {
  return this.findOne({
    'invitations.token': token,
    'invitations.status': 'pending',
    'invitations.expiresAt': { $gt: new Date() },
    status: { $ne: 'deleted' }
  });
};

module.exports = mongoose.model('Team', teamSchema);