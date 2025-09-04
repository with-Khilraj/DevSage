/**
 * Code Suggestions Demo Page
 * Demonstrates the Code Suggestions Panel UI with mock data
 */

import React, { useState } from 'react';
import { CodeSuggestionsPanel } from '../components/analysis';
import { MainLayout } from '../components/ui';

const CodeSuggestionsDemoPage = () => {
  // Mock suggestions data
  const [mockSuggestions] = useState([
    {
      id: 'suggestion_1',
      type: 'security',
      severity: 'critical',
      line: 15,
      column: 8,
      message: 'Potential SQL injection vulnerability',
      description: 'User input is directly concatenated into SQL query without sanitization',
      suggestedFix: 'Use parameterized queries or prepared statements',
      confidence: 0.95,
      kiroReasoning: 'Direct string concatenation with user input detected in SQL context. This creates a high-risk SQL injection vulnerability.',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
    },
    {
      id: 'suggestion_2',
      type: 'performance',
      severity: 'high',
      line: 23,
      column: 12,
      message: 'Inefficient loop operation',
      description: 'Array.find() called inside a loop can be optimized',
      suggestedFix: 'Consider using a Map or Set for O(1) lookups instead of nested loops',
      confidence: 0.87,
      kiroReasoning: 'Nested loop with linear search detected. This has O(n²) complexity and can be optimized to O(n).',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    },
    {
      id: 'suggestion_3',
      type: 'maintainability',
      severity: 'medium',
      line: 45,
      column: 4,
      message: 'Function complexity is high',
      description: 'This function has a cyclomatic complexity of 12, consider breaking it down',
      suggestedFix: 'Extract smaller functions for better readability and maintainability',
      confidence: 0.78,
      kiroReasoning: 'High cyclomatic complexity detected. Functions with complexity > 10 are harder to test and maintain.',
      status: 'accepted',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'suggestion_4',
      type: 'style',
      severity: 'low',
      line: 67,
      column: 1,
      message: 'Missing JSDoc documentation',
      description: 'Public function lacks proper documentation',
      suggestedFix: 'Add JSDoc comments describing parameters, return value, and purpose',
      confidence: 0.65,
      kiroReasoning: 'Public function without documentation detected. Good documentation improves code maintainability.',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
    },
    {
      id: 'suggestion_5',
      type: 'security',
      severity: 'high',
      line: 89,
      column: 15,
      message: 'Potential XSS vulnerability',
      description: 'User input rendered without sanitization',
      suggestedFix: 'Use proper HTML escaping or a sanitization library',
      confidence: 0.92,
      kiroReasoning: 'Direct HTML rendering of user input detected. This can lead to cross-site scripting attacks.',
      status: 'applied',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
    },
    {
      id: 'suggestion_6',
      type: 'performance',
      severity: 'medium',
      line: 102,
      column: 8,
      message: 'Unnecessary re-renders detected',
      description: 'Component re-renders on every parent update',
      suggestedFix: 'Wrap component with React.memo() or optimize dependencies',
      confidence: 0.81,
      kiroReasoning: 'Component lacks memoization and re-renders frequently. This impacts performance.',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
      id: 'suggestion_7',
      type: 'maintainability',
      severity: 'low',
      line: 125,
      column: 20,
      message: 'Magic number detected',
      description: 'Hardcoded number should be a named constant',
      suggestedFix: 'Extract magic number to a named constant with descriptive name',
      confidence: 0.72,
      kiroReasoning: 'Magic number 42 found in code. Named constants improve code readability.',
      status: 'rejected',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
    },
    {
      id: 'suggestion_8',
      type: 'security',
      severity: 'medium',
      line: 150,
      column: 5,
      message: 'Weak password validation',
      description: 'Password validation rules are too permissive',
      suggestedFix: 'Implement stronger password requirements (length, complexity, etc.)',
      confidence: 0.88,
      kiroReasoning: 'Weak password validation detected. Strong passwords are essential for security.',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString() // 7 hours ago
    }
  ]);

  const [currentFilePath] = useState('src/components/UserProfile.jsx');

  // Handle suggestion updates
  const handleSuggestionUpdate = ({ action, suggestionIds }) => {
    console.log(`Action: ${action} applied to suggestions:`, suggestionIds);
    // In a real app, this would update the backend and refresh the data
  };

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        {/* Page Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Code Suggestions Panel</h1>
              <p className="text-gray-400 mt-1">
                Advanced filtering, bulk actions, and detailed suggestion management
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Demo Mode</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Code Suggestions Panel */}
        <div className="flex-1">
          <CodeSuggestionsPanel
            filePath={currentFilePath}
            initialSuggestions={mockSuggestions}
            onSuggestionUpdate={handleSuggestionUpdate}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default CodeSuggestionsDemoPage;