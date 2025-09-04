/**
 * Kiro Content Generator - Specialized service for generating Git-related content using Kiro AI
 * Handles commit messages, PR descriptions, changelogs, and other development content
 */

const KiroAIService = require('./kiroAIService');

class KiroContentGenerator {
  constructor() {
    this.kiroAI = new KiroAIService();
    this.generationCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.userPreferences = new Map();
  }

  /**
   * Generate commit message with enhanced context analysis
   * @param {string} diff - Git diff content
   * @param {Object} context - Commit context
   * @returns {Promise<Object>} Generated commit message with metadata
   */
  async generateCommitMessage(diff, context = {}) {
    const cacheKey = this.generateCacheKey('commit', diff, context);
    
    if (this.generationCache.has(cacheKey)) {
      const cached = this.generationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.result, fromCache: true };
      }
    }

    try {
      // Analyze the diff for better context
      const diffAnalysis = this.analyzeDiff(diff);
      
      // Enhance context with diff analysis
      const enhancedContext = {
        ...context,
        diffAnalysis,
        userPreferences: this.getUserPreferences(context.userId)
      };

      const commitMessage = await this.kiroAI.generateCommitMessage(diff, enhancedContext);
      
      // Enhance the generated message
      const enhancedMessage = await this.enhanceCommitMessage(commitMessage, diffAnalysis, context);
      
      // Cache the result
      this.generationCache.set(cacheKey, {
        result: enhancedMessage,
        timestamp: Date.now()
      });

      return enhancedMessage;
    } catch (error) {
      console.error('Commit message generation failed:', error);
      throw new Error(`Commit message generation failed: ${error.message}`);
    }
  }

  /**
   * Generate PR content with comprehensive analysis
   * @param {Array} commits - Array of commit objects
   * @param {string} diff - Combined diff
   * @param {Object} context - PR context
   * @returns {Promise<Object>} Generated PR content
   */
  async generatePRContent(commits, diff, context = {}) {
    const cacheKey = this.generateCacheKey('pr', diff, { ...context, commits: commits.length });
    
    if (this.generationCache.has(cacheKey)) {
      const cached = this.generationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.result, fromCache: true };
      }
    }

    try {
      // Analyze commits and diff
      const commitAnalysis = this.analyzeCommits(commits);
      const diffAnalysis = this.analyzeDiff(diff);
      
      const enhancedContext = {
        ...context,
        commitAnalysis,
        diffAnalysis,
        userPreferences: this.getUserPreferences(context.userId)
      };

      const prContent = await this.kiroAI.generatePRContent(commits, diff, enhancedContext);
      
      // Enhance the generated PR content
      const enhancedPR = await this.enhancePRContent(prContent, commitAnalysis, diffAnalysis, context);
      
      // Cache the result
      this.generationCache.set(cacheKey, {
        result: enhancedPR,
        timestamp: Date.now()
      });

      return enhancedPR;
    } catch (error) {
      console.error('PR content generation failed:', error);
      throw new Error(`PR content generation failed: ${error.message}`);
    }
  }

  /**
   * Generate changelog from commits and PRs
   * @param {Array} commits - Array of commits
   * @param {Array} prs - Array of PRs (optional)
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated changelog
   */
  async generateChangelog(commits, prs = [], options = {}) {
    try {
      // Categorize commits
      const categorizedCommits = this.categorizeCommits(commits);
      
      // Analyze PRs if provided
      const prAnalysis = prs.length > 0 ? this.analyzePRs(prs) : null;
      
      const changelogData = {
        version: options.version || 'Unreleased',
        date: options.date || new Date().toISOString().split('T')[0],
        categories: {
          features: categorizedCommits.features,
          fixes: categorizedCommits.fixes,
          breaking: categorizedCommits.breaking,
          improvements: categorizedCommits.improvements,
          security: categorizedCommits.security
        },
        prAnalysis,
        metadata: {
          totalCommits: commits.length,
          totalPRs: prs.length,
          contributors: this.extractContributors(commits),
          generatedAt: new Date().toISOString()
        }
      };

      // Generate formatted changelog
      const formattedChangelog = this.formatChangelog(changelogData, options.format || 'markdown');
      
      return {
        raw: changelogData,
        formatted: formattedChangelog,
        summary: this.generateChangelogSummary(changelogData),
        kiroGenerated: true
      };
    } catch (error) {
      console.error('Changelog generation failed:', error);
      throw new Error(`Changelog generation failed: ${error.message}`);
    }
  }

  /**
   * Generate release notes
   * @param {string} version - Version number
   * @param {Array} commits - Commits for this release
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated release notes
   */
  async generateReleaseNotes(version, commits, options = {}) {
    try {
      const changelog = await this.generateChangelog(commits, [], { version, ...options });
      
      const releaseNotes = {
        version,
        title: `Release ${version}`,
        date: new Date().toISOString().split('T')[0],
        summary: changelog.summary,
        highlights: this.extractHighlights(changelog.raw),
        changelog: changelog.formatted,
        downloadLinks: options.downloadLinks || [],
        upgradeInstructions: this.generateUpgradeInstructions(changelog.raw),
        breakingChanges: changelog.raw.categories.breaking,
        contributors: changelog.raw.metadata.contributors,
        kiroGenerated: true
      };

      return releaseNotes;
    } catch (error) {
      console.error('Release notes generation failed:', error);
      throw new Error(`Release notes generation failed: ${error.message}`);
    }
  }

  /**
   * Generate documentation from code changes
   * @param {string} diff - Code diff
   * @param {Object} context - Documentation context
   * @returns {Promise<Object>} Generated documentation
   */
  async generateDocumentation(diff, context = {}) {
    try {
      const diffAnalysis = this.analyzeDiff(diff);
      
      // Extract API changes, new functions, etc.
      const apiChanges = this.extractAPIChanges(diffAnalysis);
      
      const documentation = {
        apiChanges,
        newFeatures: this.extractNewFeatures(diffAnalysis),
        updatedFunctions: this.extractUpdatedFunctions(diffAnalysis),
        examples: await this.generateCodeExamples(apiChanges),
        migrationGuide: this.generateMigrationGuide(diffAnalysis),
        kiroGenerated: true
      };

      return documentation;
    } catch (error) {
      console.error('Documentation generation failed:', error);
      throw new Error(`Documentation generation failed: ${error.message}`);
    }
  }

  // Private helper methods

  analyzeDiff(diff) {
    const lines = diff.split('\n');
    const analysis = {
      filesChanged: [],
      linesAdded: 0,
      linesRemoved: 0,
      changeTypes: [],
      languages: new Set(),
      complexity: 'low'
    };

    let currentFile = null;
    
    lines.forEach(line => {
      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.*) b\/(.*)/);
        if (match) {
          currentFile = match[2];
          analysis.filesChanged.push(currentFile);
          
          // Detect language
          const ext = currentFile.split('.').pop()?.toLowerCase();
          if (ext) analysis.languages.add(ext);
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        analysis.linesAdded++;
        
        // Detect change types
        if (line.includes('function') || line.includes('const') || line.includes('class')) {
          analysis.changeTypes.push('feature');
        }
        if (line.includes('fix') || line.includes('bug')) {
          analysis.changeTypes.push('fix');
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        analysis.linesRemoved++;
      }
    });

    // Determine complexity
    const totalChanges = analysis.linesAdded + analysis.linesRemoved;
    if (totalChanges > 100) analysis.complexity = 'high';
    else if (totalChanges > 50) analysis.complexity = 'medium';

    analysis.languages = Array.from(analysis.languages);
    analysis.changeTypes = [...new Set(analysis.changeTypes)];

    return analysis;
  }

  analyzeCommits(commits) {
    return {
      count: commits.length,
      authors: [...new Set(commits.map(c => c.author))],
      types: this.extractCommitTypes(commits),
      scope: this.extractCommitScopes(commits),
      timespan: this.calculateTimespan(commits),
      patterns: this.identifyCommitPatterns(commits)
    };
  }

  analyzePRs(prs) {
    return {
      count: prs.length,
      authors: [...new Set(prs.map(pr => pr.author))],
      labels: this.extractPRLabels(prs),
      reviewers: this.extractReviewers(prs),
      mergePatterns: this.identifyMergePatterns(prs)
    };
  }

  categorizeCommits(commits) {
    const categories = {
      features: [],
      fixes: [],
      breaking: [],
      improvements: [],
      security: [],
      other: []
    };

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      const type = this.extractCommitType(commit.message);

      const commitInfo = {
        hash: commit.hash,
        message: commit.message,
        author: commit.author,
        date: commit.date,
        type
      };

      if (type === 'feat' || message.includes('add') || message.includes('new')) {
        categories.features.push(commitInfo);
      } else if (type === 'fix' || message.includes('fix') || message.includes('bug')) {
        categories.fixes.push(commitInfo);
      } else if (message.includes('breaking') || message.includes('!:')) {
        categories.breaking.push(commitInfo);
      } else if (type === 'perf' || type === 'refactor' || message.includes('improve')) {
        categories.improvements.push(commitInfo);
      } else if (type === 'security' || message.includes('security') || message.includes('vulnerability')) {
        categories.security.push(commitInfo);
      } else {
        categories.other.push(commitInfo);
      }
    });

    return categories;
  }

  async enhanceCommitMessage(baseMessage, diffAnalysis, context) {
    return {
      ...baseMessage,
      metadata: {
        filesChanged: diffAnalysis.filesChanged.length,
        linesChanged: diffAnalysis.linesAdded + diffAnalysis.linesRemoved,
        languages: diffAnalysis.languages,
        complexity: diffAnalysis.complexity,
        generatedAt: new Date().toISOString()
      },
      alternatives: await this.generateAlternativeMessages(baseMessage, diffAnalysis),
      suggestions: this.generateCommitSuggestions(diffAnalysis, context)
    };
  }

  async enhancePRContent(basePR, commitAnalysis, diffAnalysis, context) {
    return {
      ...basePR,
      metadata: {
        commitCount: commitAnalysis.count,
        filesChanged: diffAnalysis.filesChanged.length,
        linesChanged: diffAnalysis.linesAdded + diffAnalysis.linesRemoved,
        languages: diffAnalysis.languages,
        complexity: diffAnalysis.complexity,
        authors: commitAnalysis.authors,
        generatedAt: new Date().toISOString()
      },
      sections: {
        summary: basePR.description,
        changes: this.generateChangesSection(diffAnalysis),
        testing: this.generateTestingSection(diffAnalysis, context),
        deployment: this.generateDeploymentSection(diffAnalysis, context),
        breaking: this.identifyBreakingChanges(diffAnalysis)
      },
      checklist: this.generatePRChecklist(diffAnalysis, context)
    };
  }

  formatChangelog(changelogData, format) {
    switch (format) {
      case 'markdown':
        return this.formatMarkdownChangelog(changelogData);
      case 'json':
        return JSON.stringify(changelogData, null, 2);
      case 'html':
        return this.formatHTMLChangelog(changelogData);
      default:
        return this.formatMarkdownChangelog(changelogData);
    }
  }

  formatMarkdownChangelog(data) {
    let markdown = `# Changelog\n\n`;
    markdown += `## [${data.version}] - ${data.date}\n\n`;

    if (data.categories.breaking.length > 0) {
      markdown += `### ⚠️ BREAKING CHANGES\n\n`;
      data.categories.breaking.forEach(item => {
        markdown += `- ${item.message} (${item.hash.substring(0, 7)})\n`;
      });
      markdown += '\n';
    }

    if (data.categories.features.length > 0) {
      markdown += `### ✨ Features\n\n`;
      data.categories.features.forEach(item => {
        markdown += `- ${item.message} (${item.hash.substring(0, 7)})\n`;
      });
      markdown += '\n';
    }

    if (data.categories.fixes.length > 0) {
      markdown += `### 🐛 Bug Fixes\n\n`;
      data.categories.fixes.forEach(item => {
        markdown += `- ${item.message} (${item.hash.substring(0, 7)})\n`;
      });
      markdown += '\n';
    }

    if (data.categories.improvements.length > 0) {
      markdown += `### 🚀 Improvements\n\n`;
      data.categories.improvements.forEach(item => {
        markdown += `- ${item.message} (${item.hash.substring(0, 7)})\n`;
      });
      markdown += '\n';
    }

    if (data.categories.security.length > 0) {
      markdown += `### 🔒 Security\n\n`;
      data.categories.security.forEach(item => {
        markdown += `- ${item.message} (${item.hash.substring(0, 7)})\n`;
      });
      markdown += '\n';
    }

    // Add contributors
    if (data.metadata.contributors.length > 0) {
      markdown += `### 👥 Contributors\n\n`;
      data.metadata.contributors.forEach(contributor => {
        markdown += `- ${contributor}\n`;
      });
    }

    return markdown;
  }

  generateCacheKey(type, content, context) {
    const hash = require('crypto')
      .createHash('md5')
      .update(type + content + JSON.stringify(context))
      .digest('hex');
    return hash;
  }

  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || {
      commitStyle: 'conventional',
      includeEmojis: false,
      verbosity: 'medium'
    };
  }

  setUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, preferences);
  }

  extractCommitType(message) {
    const match = message.match(/^(\w+)(\(.+\))?:/);
    return match ? match[1] : 'other';
  }

  extractCommitTypes(commits) {
    return [...new Set(commits.map(c => this.extractCommitType(c.message)))];
  }

  extractCommitScopes(commits) {
    const scopes = commits.map(c => {
      const match = c.message.match(/^\w+\((.+)\):/);
      return match ? match[1] : null;
    }).filter(Boolean);
    return [...new Set(scopes)];
  }

  calculateTimespan(commits) {
    if (commits.length === 0) return null;
    
    const dates = commits.map(c => new Date(c.date)).sort();
    const start = dates[0];
    const end = dates[dates.length - 1];
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    };
  }

  identifyCommitPatterns(commits) {
    const patterns = [];
    
    const types = this.extractCommitTypes(commits);
    if (types.includes('feat') && types.includes('test')) {
      patterns.push('test-driven-development');
    }
    
    if (commits.some(c => c.message.includes('fix') && c.message.includes('test'))) {
      patterns.push('bug-fix-with-tests');
    }
    
    return patterns;
  }

  extractContributors(commits) {
    return [...new Set(commits.map(c => c.author))];
  }

  generateChangelogSummary(changelogData) {
    const total = Object.values(changelogData.categories).reduce((sum, cat) => sum + cat.length, 0);
    
    return {
      totalChanges: total,
      features: changelogData.categories.features.length,
      fixes: changelogData.categories.fixes.length,
      breaking: changelogData.categories.breaking.length,
      contributors: changelogData.metadata.contributors.length,
      impact: changelogData.categories.breaking.length > 0 ? 'major' : 
              changelogData.categories.features.length > 0 ? 'minor' : 'patch'
    };
  }

  // Additional helper methods would continue here...
  // For brevity, I'm including the essential structure

  /**
   * Clear generation cache
   */
  clearCache() {
    this.generationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.generationCache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.generationCache.keys())
    };
  }
}

module.exports = KiroContentGenerator;