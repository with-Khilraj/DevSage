/**
 * useCodeAnalysis Hook
 * React hook for managing code analysis state and operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import codeAnalysisService from '../services/codeAnalysisService';

export const useCodeAnalysis = () => {
  const [analyses, setAnalyses] = useState(new Map());
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    isConnected, 
    activeAnalyses, 
    addEventListener, 
    removeEventListener 
  } = useSocket();
  
  const analysisTimeouts = useRef(new Map());

  // Sync with socket active analyses
  useEffect(() => {
    setAnalyses(activeAnalyses);
  }, [activeAnalyses]);

  // Setup real-time event listeners
  useEffect(() => {
    const handleAnalysisComplete = (data) => {
      // Update local state with completed analysis
      setAnalyses(prev => {
        const updated = new Map(prev);
        updated.set(data.analysisId, {
          ...updated.get(data.analysisId),
          ...data,
          status: 'complete'
        });
        return updated;
      });

      // Auto-remove after delay
      const timeoutId = setTimeout(() => {
        setAnalyses(prev => {
          const updated = new Map(prev);
          updated.delete(data.analysisId);
          return updated;
        });
      }, 5000);

      analysisTimeouts.current.set(data.analysisId, timeoutId);
    };

    const handleAnalysisError = (data) => {
      setAnalyses(prev => {
        const updated = new Map(prev);
        updated.set(data.analysisId, {
          ...updated.get(data.analysisId),
          ...data,
          status: 'error'
        });
        return updated;
      });

      setError(data.error);
    };

    if (isConnected) {
      addEventListener('code_analysis_complete', handleAnalysisComplete);
      addEventListener('code_analysis_error', handleAnalysisError);
    }

    return () => {
      if (isConnected) {
        removeEventListener('code_analysis_complete', handleAnalysisComplete);
        removeEventListener('code_analysis_error', handleAnalysisError);
      }
      
      // Clear timeouts
      analysisTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
      analysisTimeouts.current.clear();
    };
  }, [isConnected, addEventListener, removeEventListener]);

  // Analyze code
  const analyzeCode = useCallback(async (codeContent, filePath, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await codeAnalysisService.analyzeCode(codeContent, filePath, options);
      
      if (!result.success) {
        setError(result.error);
        return result;
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Analysis failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Batch analyze files
  const batchAnalyze = useCallback(async (files, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await codeAnalysisService.batchAnalyze(files, options);
      
      if (!result.success) {
        setError(result.error);
        return result;
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Batch analysis failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get suggestions for a file
  const getSuggestions = useCallback(async (filePath, filters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await codeAnalysisService.getSuggestions(filePath, filters);
      
      if (result.success) {
        setSuggestions(result.suggestions);
      } else {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get suggestions';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Submit feedback for suggestion
  const submitFeedback = useCallback(async (suggestionId, feedback, comment = '') => {
    try {
      const result = await codeAnalysisService.submitFeedback(suggestionId, feedback, comment);
      
      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to submit feedback';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get analysis history
  const getHistory = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await codeAnalysisService.getHistory(options);
      
      if (result.success) {
        setHistory(result.history);
      } else {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get history';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get analysis statistics
  const getStats = useCallback(async (period = '7d') => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await codeAnalysisService.getStats(period);
      
      if (result.success) {
        setStats(result.stats);
      } else {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get statistics';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cancel analysis
  const cancelAnalysis = useCallback((analysisId) => {
    // Clear timeout if exists
    const timeoutId = analysisTimeouts.current.get(analysisId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      analysisTimeouts.current.delete(analysisId);
    }

    // Remove from analyses
    setAnalyses(prev => {
      const updated = new Map(prev);
      updated.delete(analysisId);
      return updated;
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get analysis by ID
  const getAnalysis = useCallback((analysisId) => {
    return analyses.get(analysisId);
  }, [analyses]);

  // Get active analyses as array
  const getActiveAnalyses = useCallback(() => {
    return Array.from(analyses.values()).filter(analysis => 
      analysis.status === 'running' || analysis.status === 'complete'
    );
  }, [analyses]);

  // Get completed analyses
  const getCompletedAnalyses = useCallback(() => {
    return Array.from(analyses.values()).filter(analysis => 
      analysis.status === 'complete'
    );
  }, [analyses]);

  // Check if file is being analyzed
  const isFileBeingAnalyzed = useCallback((filePath) => {
    return Array.from(analyses.values()).some(analysis => 
      analysis.filePath === filePath && analysis.status === 'running'
    );
  }, [analyses]);

  // Get analysis progress for file
  const getFileAnalysisProgress = useCallback((filePath) => {
    const analysis = Array.from(analyses.values()).find(analysis => 
      analysis.filePath === filePath && analysis.status === 'running'
    );
    return analysis?.progress || 0;
  }, [analyses]);

  return {
    // State
    analyses: Array.from(analyses.values()),
    suggestions,
    history,
    stats,
    isLoading,
    error,
    isConnected,

    // Actions
    analyzeCode,
    batchAnalyze,
    getSuggestions,
    submitFeedback,
    getHistory,
    getStats,
    cancelAnalysis,
    clearError,

    // Utilities
    getAnalysis,
    getActiveAnalyses,
    getCompletedAnalyses,
    isFileBeingAnalyzed,
    getFileAnalysisProgress,

    // Service utilities
    getSeverityColor: codeAnalysisService.getSeverityColor,
    getTypeIcon: codeAnalysisService.getTypeIcon,
    formatQualityScore: codeAnalysisService.formatQualityScore
  };
};

export default useCodeAnalysis;