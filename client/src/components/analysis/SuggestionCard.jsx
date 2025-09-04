/**
 * Suggestion Card Component
 * Individual suggestion card with before/after code diffs and actions
 */

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Button, Badge, Checkbox, Modal } from '../ui';
import codeAnalysisService from '../../services/codeAnalysisService';

const SuggestionCard = ({
  suggestion,
  isSelected = false,
  isExpanded = false,
  viewMode = 'list',
  onSelect,
  onExpand,
  onAction,
  className = '',
  ...props
}) => {
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'security':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'performance':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'maintainability':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'style':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v7z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Handle feedback submission
  const handleFeedback = async (feedback, comment = '') => {
    setIsSubmittingFeedback(true);
    try {
      await codeAnalysisService.submitFeedback(suggestion.id, feedback, comment);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Generate mock before/after code for demo
  const generateCodeDiff = () => {
    const beforeCode = `// Before: ${suggestion.message}
function processData(data) {
    // ${suggestion.description}
    const result = data.map(item => {
        return item.value * 2;
    });
    return result;
}`;

    const afterCode = `// After: Applied suggestion
function processData(data) {
    // ${suggestion.suggestedFix}
    return data.map(item => item.value * 2);
}`;

    return { beforeCode, afterCode };
  };

  const { beforeCode, afterCode } = generateCodeDiff();

  // Compact view for compact mode
  if (viewMode === 'compact') {
    return (
      <div
        className={twMerge(
          'flex items-center p-3 rounded-lg border backdrop-blur-sm hover:bg-white/5 transition-colors',
          getSeverityColor(suggestion.severity),
          isSelected && 'ring-2 ring-blue-500/50',
          className
        )}
        {...props}
      >
        <Checkbox
          checked={isSelected}
          onChange={onSelect}
          className="mr-3"
        />
        
        <div className="flex-shrink-0 mr-3">
          {getTypeIcon(suggestion.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {suggestion.message}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Badge variant="outline-primary" size="xs">
            {suggestion.type}
          </Badge>
          <Badge 
            variant={suggestion.severity === 'critical' || suggestion.severity === 'high' ? 'danger' : 'warning'} 
            size="xs"
          >
            {suggestion.severity}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExpand(!isExpanded)}
          >
            <svg className={twMerge('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
      </div>
    );
  }

  // Full card view
  return (
    <div
      className={twMerge(
        'rounded-xl border backdrop-blur-sm transition-all duration-200',
        getSeverityColor(suggestion.severity),
        isSelected && 'ring-2 ring-blue-500/50',
        'hover:shadow-lg hover:shadow-black/20',
        className
      )}
      {...props}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={isSelected}
            onChange={onSelect}
            className="mt-1"
          />
          
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon(suggestion.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white mb-1">
                  {suggestion.message}
                </h3>
                {suggestion.description && (
                  <p className="text-sm text-gray-300 mb-2">
                    {suggestion.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Badge variant="outline-primary" size="xs">
                  {suggestion.type}
                </Badge>
                <Badge 
                  variant={suggestion.severity === 'critical' || suggestion.severity === 'high' ? 'danger' : 'warning'} 
                  size="xs"
                >
                  {suggestion.severity}
                </Badge>
              </div>
            </div>
            
            {/* Location and Confidence */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                {suggestion.line && (
                  <span>Line {suggestion.line}{suggestion.column && `:${suggestion.column}`}</span>
                )}
                {suggestion.confidence && (
                  <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                )}
              </div>
              
              <button
                onClick={() => onExpand(!isExpanded)}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              >
                <span>{isExpanded ? 'Less' : 'More'}</span>
                <svg className={twMerge('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Fix */}
      {suggestion.suggestedFix && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-start space-x-2">
            <svg className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-400 mb-1">Suggested Fix:</p>
              <p className="text-sm text-gray-300">{suggestion.suggestedFix}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-b border-white/10 space-y-4">
          {/* Impact Analysis */}
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Impact Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Risk Level:</span>
                <span className={twMerge(
                  'ml-2 font-medium',
                  suggestion.severity === 'critical' ? 'text-red-400' :
                  suggestion.severity === 'high' ? 'text-orange-400' :
                  suggestion.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                )}>
                  {suggestion.severity.charAt(0).toUpperCase() + suggestion.severity.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Effort:</span>
                <span className="ml-2 text-white">
                  {suggestion.severity === 'critical' || suggestion.severity === 'high' ? 'Low' : 'Medium'}
                </span>
              </div>
            </div>
          </div>

          {/* Kiro Reasoning */}
          {suggestion.kiroReasoning && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-300 bg-white/5 rounded-lg p-3">
                {suggestion.kiroReasoning}
              </p>
            </div>
          )}

          {/* Code Diff Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">Code Changes</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiffModal(true)}
              >
                View Full Diff
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Before:</p>
                <pre className="text-xs bg-red-500/10 border border-red-500/20 rounded p-2 overflow-x-auto">
                  <code className="text-gray-300">{beforeCode.split('\n').slice(0, 3).join('\n')}...</code>
                </pre>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">After:</p>
                <pre className="text-xs bg-green-500/10 border border-green-500/20 rounded p-2 overflow-x-auto">
                  <code className="text-gray-300">{afterCode.split('\n').slice(0, 3).join('\n')}...</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => onAction('accepted')}
              disabled={suggestion.status === 'accepted'}
            >
              Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onAction('rejected')}
              disabled={suggestion.status === 'rejected'}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAction('applied')}
              disabled={suggestion.status === 'applied'}
            >
              Apply
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Feedback Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('helpful')}
              disabled={isSubmittingFeedback}
              title="Mark as helpful"
            >
              👍
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('not-helpful')}
              disabled={isSubmittingFeedback}
              title="Mark as not helpful"
            >
              👎
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('incorrect')}
              disabled={isSubmittingFeedback}
              title="Mark as incorrect"
            >
              ❌
            </Button>
          </div>
        </div>
      </div>

      {/* Full Diff Modal */}
      <Modal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        title="Code Diff"
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">{suggestion.message}</h3>
            <p className="text-gray-300 text-sm">{suggestion.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">Before (Current Code)</h4>
              <pre className="text-xs bg-red-500/10 border border-red-500/20 rounded p-4 overflow-auto max-h-64">
                <code className="text-gray-300">{beforeCode}</code>
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">After (Suggested Fix)</h4>
              <pre className="text-xs bg-green-500/10 border border-green-500/20 rounded p-4 overflow-auto max-h-64">
                <code className="text-gray-300">{afterCode}</code>
              </pre>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowDiffModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => {
              onAction('applied');
              setShowDiffModal(false);
            }}>
              Apply Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuggestionCard;