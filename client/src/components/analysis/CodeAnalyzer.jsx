/**
 * Code Analyzer Component
 * Interactive code analysis interface with real-time feedback
 */

import React, { useState, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { useCodeAnalysis } from '../../hooks/useCodeAnalysis';
import { Button, Input, Card, Badge, ProgressBar, Textarea } from '../ui';

const CodeAnalyzer = ({
  className = '',
  defaultCode = '',
  defaultFilePath = 'untitled.js',
  ...props
}) => {
  const [codeContent, setCodeContent] = useState(defaultCode);
  const [filePath, setFilePath] = useState(defaultFilePath);
  const [analysisOptions, setAnalysisOptions] = useState({
    includePerformance: true,
    includeSecurity: true,
    includeMaintainability: true,
    includeStyle: false
  });

  const {
    analyzeCode,
    analyses,
    isLoading,
    error,
    clearError,
    isFileBeingAnalyzed,
    getFileAnalysisProgress,
    cancelAnalysis,
    formatQualityScore,
    getSeverityColor,
    getTypeIcon
  } = useCodeAnalysis();

  const textareaRef = useRef(null);

  // Handle code analysis
  const handleAnalyze = async () => {
    if (!codeContent.trim()) {
      return;
    }

    clearError();
    
    const result = await analyzeCode(codeContent, filePath, {
      repository: { name: 'demo-project' },
      ...analysisOptions
    });

    if (!result.success) {
      console.error('Analysis failed:', result.error);
    }
  };

  // Handle option change
  const handleOptionChange = (option) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Get current analysis for this file
  const currentAnalysis = analyses.find(a => a.filePath === filePath);
  const isAnalyzing = isFileBeingAnalyzed(filePath);
  const progress = getFileAnalysisProgress(filePath);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCodeContent(e.target.result);
      setFilePath(file.name);
    };
    reader.readAsText(file);
  };

  // Sample code examples
  const sampleCodes = {
    javascript: {
      name: 'JavaScript Example',
      code: `// Sample JavaScript code with potential issues
function processUserData(userData) {
    // Security issue: No input validation
    const query = "SELECT * FROM users WHERE id = " + userData.id;
    
    // Performance issue: Inefficient loop
    let results = [];
    for (let i = 0; i < userData.items.length; i++) {
        for (let j = 0; j < allItems.length; j++) {
            if (userData.items[i].id === allItems[j].id) {
                results.push(allItems[j]);
                break;
            }
        }
    }
    
    // Maintainability issue: Complex nested conditions
    if (userData.type === 'premium') {
        if (userData.subscription.active) {
            if (userData.subscription.plan === 'pro') {
                if (userData.features.includes('advanced')) {
                    return processAdvancedUser(results);
                }
            }
        }
    }
    
    return results;
}`
    },
    react: {
      name: 'React Component',
      code: `import React, { useState, useEffect } from 'react';

// Component with potential improvements
const UserProfile = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Performance issue: Missing dependency array
    useEffect(() => {
        fetchUser(userId).then(userData => {
            setUser(userData);
            setLoading(false);
        });
    });
    
    // Security issue: Potential XSS
    const renderUserBio = (bio) => {
        return <div dangerouslySetInnerHTML={{__html: bio}} />;
    };
    
    // Maintainability issue: Inline styles
    return (
        <div style={{padding: '20px', margin: '10px', backgroundColor: '#f5f5f5'}}>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    <h1>{user.name}</h1>
                    {renderUserBio(user.bio)}
                </div>
            )}
        </div>
    );
};`
    }
  };

  return (
    <Card variant="glass" className={twMerge('w-full', className)} {...props}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Code Analyzer</h2>
            <p className="text-gray-400 text-sm">Analyze your code with Kiro AI</p>
          </div>
          
          <Badge variant="primary" size="sm">
            🤖 Powered by Kiro AI
          </Badge>
        </div>

        {/* File Path Input */}
        <div className="flex items-center space-x-4 mb-4">
          <Input
            label="File Path"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="e.g., src/components/App.js"
            className="flex-1"
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          
          {/* File Upload */}
          <div>
            <input
              type="file"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="secondary"
              size="md"
              onClick={() => document.getElementById('file-upload').click()}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              }
            >
              Upload
            </Button>
          </div>
        </div>

        {/* Sample Code Buttons */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-400">Quick samples:</span>
          {Object.entries(sampleCodes).map(([key, sample]) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => {
                setCodeContent(sample.code);
                setFilePath(`sample.${key === 'react' ? 'jsx' : 'js'}`);
              }}
            >
              {sample.name}
            </Button>
          ))}
        </div>

        {/* Analysis Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Analysis Options:</label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(analysisOptions).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleOptionChange(key)}
                  className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-300 capitalize">
                  {key.replace('include', '').replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Code Input */}
      <div className="p-6 border-b border-white/10">
        <Textarea
          ref={textareaRef}
          label="Code to Analyze"
          value={codeContent}
          onChange={(e) => setCodeContent(e.target.value)}
          placeholder="Paste your code here or upload a file..."
          rows={12}
          className="font-mono text-sm"
          helperText={`${codeContent.length} characters`}
        />
      </div>

      {/* Analysis Controls */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!codeContent.trim() || isAnalyzing}
              loading={isAnalyzing}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
            </Button>

            {isAnalyzing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => cancelAnalysis(currentAnalysis?.analysisId)}
              >
                Cancel
              </Button>
            )}
          </div>

          {currentAnalysis && currentAnalysis.status === 'complete' && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Quality Score</div>
                <div className={twMerge('text-lg font-bold', formatQualityScore(currentAnalysis.qualityScore).color)}>
                  {currentAnalysis.qualityScore}/100 ({formatQualityScore(currentAnalysis.qualityScore).grade})
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mt-4">
            <ProgressBar
              progress={progress}
              color="blue"
              showLabel
              label={currentAnalysis?.message || 'Analyzing code...'}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-200 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-auto p-1"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {currentAnalysis && currentAnalysis.status === 'complete' && (
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
              <Badge variant="success" size="sm">
                ✓ Complete
              </Badge>
            </div>

            {/* Suggestions */}
            {currentAnalysis.suggestions && currentAnalysis.suggestions.length > 0 ? (
              <div className="space-y-3">
                {currentAnalysis.suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id || index}
                    className={twMerge(
                      'p-4 rounded-xl border backdrop-blur-sm',
                      getSeverityColor(suggestion.severity)
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(suggestion.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white mb-1">
                              {suggestion.message}
                            </p>
                            {suggestion.description && (
                              <p className="text-sm text-gray-300 mb-2">
                                {suggestion.description}
                              </p>
                            )}
                            {suggestion.suggestedFix && (
                              <p className="text-sm text-gray-400">
                                <strong>Suggested fix:</strong> {suggestion.suggestedFix}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="outline-primary" size="xs">
                              {suggestion.type}
                            </Badge>
                            <Badge 
                              variant={suggestion.severity === 'high' ? 'danger' : 'warning'} 
                              size="xs"
                            >
                              {suggestion.severity}
                            </Badge>
                          </div>
                        </div>
                        
                        {(suggestion.line || suggestion.confidence) && (
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            {suggestion.line && (
                              <span>Line {suggestion.line}{suggestion.column && `:${suggestion.column}`}</span>
                            )}
                            {suggestion.confidence && (
                              <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="h-12 w-12 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-400 font-medium">Great job! No issues found.</p>
                <p className="text-gray-400 text-sm mt-1">Your code looks clean and follows best practices.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CodeAnalyzer;