/**
 * Code Suggestions Panel UI
 * Advanced filtering sidebar with suggestion cards, bulk actions, and statistics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import { Button, Input, Card, Badge, Checkbox, Modal } from '../ui';
import codeAnalysisService from '../../services/codeAnalysisService';
import SuggestionCard from './SuggestionCard';
import SuggestionFilters from './SuggestionFilters';
import SuggestionStats from './SuggestionStats';
import BulkActionBar from './BulkActionBar';

const CodeSuggestionsPanel = ({
  className = '',
  filePath = '',
  initialSuggestions = [],
  onSuggestionUpdate,
  ...props
}) => {
  // State management
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    severity: [],
    type: [],
    status: ['pending'],
    minConfidence: 0.5,
    searchQuery: '',
    dateRange: null,
    showApplied: false
  });

  // View state
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'compact'
  const [sortBy, setSortBy] = useState('severity'); // 'severity', 'confidence', 'type', 'date'
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Load suggestions on mount and when filePath changes
  useEffect(() => {
    if (filePath) {
      loadSuggestions();
    }
  }, [filePath]);

  // Apply filters and sorting when suggestions or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [suggestions, filters, sortBy, sortOrder]);

  /**
   * Load suggestions from API
   */
  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await codeAnalysisService.getSuggestions(filePath, {
        severity: filters.severity,
        type: filters.type,
        minConfidence: filters.minConfidence
      });

      if (result.success) {
        setSuggestions(result.suggestions || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load suggestions');
      console.error('Load suggestions error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply filters and sorting to suggestions
   */
  const applyFiltersAndSort = () => {
    let filtered = [...suggestions];

    // Apply filters
    if (filters.severity.length > 0) {
      filtered = filtered.filter(s => filters.severity.includes(s.severity));
    }

    if (filters.type.length > 0) {
      filtered = filtered.filter(s => filters.type.includes(s.type));
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(s => filters.status.includes(s.status || 'pending'));
    }

    if (filters.minConfidence > 0) {
      filtered = filtered.filter(s => (s.confidence || 0) >= filters.minConfidence);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.message?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.suggestedFix?.toLowerCase().includes(query)
      );
    }

    if (!filters.showApplied) {
      filtered = filtered.filter(s => s.status !== 'applied');
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = severityOrder[a.severity] || 0;
          bValue = severityOrder[b.severity] || 0;
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'date':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSuggestions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (suggestionId, selected) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(suggestionId);
      } else {
        newSet.delete(suggestionId);
      }
      return newSet;
    });
  };

  /**
   * Handle select all/none
   */
  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      const visibleIds = paginatedSuggestions.map(s => s.id);
      setSelectedSuggestions(new Set(visibleIds));
    } else {
      setSelectedSuggestions(new Set());
    }
  };

  /**
   * Handle bulk actions
   */
  const handleBulkAction = async (action) => {
    const selectedIds = Array.from(selectedSuggestions);
    
    try {
      // Here you would implement the actual bulk action API calls
      console.log(`Performing bulk action: ${action} on suggestions:`, selectedIds);
      
      // Update suggestions state based on action
      setSuggestions(prev => prev.map(suggestion => {
        if (selectedIds.includes(suggestion.id)) {
          return { ...suggestion, status: action };
        }
        return suggestion;
      }));

      // Clear selection
      setSelectedSuggestions(new Set());

      // Notify parent component
      if (onSuggestionUpdate) {
        onSuggestionUpdate({ action, suggestionIds: selectedIds });
      }
    } catch (err) {
      setError(`Failed to perform bulk action: ${err.message}`);
    }
  };

  /**
   * Handle suggestion expansion
   */
  const handleSuggestionExpand = (suggestionId, expanded) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (expanded) {
        newSet.add(suggestionId);
      } else {
        newSet.delete(suggestionId);
      }
      return newSet;
    });
  };

  /**
   * Handle individual suggestion action
   */
  const handleSuggestionAction = async (suggestionId, action) => {
    try {
      // Update suggestion status
      setSuggestions(prev => prev.map(suggestion => {
        if (suggestion.id === suggestionId) {
          return { ...suggestion, status: action };
        }
        return suggestion;
      }));

      // Notify parent component
      if (onSuggestionUpdate) {
        onSuggestionUpdate({ action, suggestionIds: [suggestionId] });
      }
    } catch (err) {
      setError(`Failed to update suggestion: ${err.message}`);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredSuggestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSuggestions = filteredSuggestions.slice(startIndex, startIndex + itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = suggestions.length;
    const pending = suggestions.filter(s => (s.status || 'pending') === 'pending').length;
    const accepted = suggestions.filter(s => s.status === 'accepted').length;
    const rejected = suggestions.filter(s => s.status === 'rejected').length;
    const applied = suggestions.filter(s => s.status === 'applied').length;

    const severityBreakdown = suggestions.reduce((acc, s) => {
      acc[s.severity] = (acc[s.severity] || 0) + 1;
      return acc;
    }, {});

    const typeBreakdown = suggestions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      pending,
      accepted,
      rejected,
      applied,
      severityBreakdown,
      typeBreakdown,
      averageConfidence: total > 0 ? 
        suggestions.reduce((sum, s) => sum + (s.confidence || 0), 0) / total : 0
    };
  }, [suggestions]);

  return (
    <div className={twMerge('flex h-full', className)} {...props}>
      {/* Filters Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-white/10">
        <SuggestionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          suggestions={suggestions}
          stats={stats}
          onRefresh={loadSuggestions}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Code Suggestions</h2>
              <p className="text-gray-400 text-sm">
                {filePath ? `Analyzing: ${filePath}` : 'Select a file to view suggestions'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/5 rounded-lg p-1">
                {['list', 'grid', 'compact'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={twMerge(
                      'px-3 py-1 text-sm rounded-md transition-colors',
                      viewMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort Controls */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="severity-desc">Severity (High to Low)</option>
                <option value="severity-asc">Severity (Low to High)</option>
                <option value="confidence-desc">Confidence (High to Low)</option>
                <option value="confidence-asc">Confidence (Low to High)</option>
                <option value="type-asc">Type (A to Z)</option>
                <option value="type-desc">Type (Z to A)</option>
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
              </select>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <SuggestionStats stats={stats} />
        </div>

        {/* Bulk Action Bar */}
        {selectedSuggestions.size > 0 && (
          <BulkActionBar
            selectedCount={selectedSuggestions.size}
            totalCount={paginatedSuggestions.length}
            onSelectAll={handleSelectAll}
            onBulkAction={handleBulkAction}
            onClearSelection={() => setSelectedSuggestions(new Set())}
          />
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="p-4 m-4 bg-red-500/20 border border-red-400/30 rounded-xl">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-200 text-sm">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto p-1"
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading suggestions...</p>
              </div>
            </div>
          ) : paginatedSuggestions.length > 0 ? (
            <div className={twMerge(
              'p-4',
              viewMode === 'grid' && 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4',
              viewMode === 'list' && 'space-y-4',
              viewMode === 'compact' && 'space-y-2'
            )}>
              {paginatedSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isSelected={selectedSuggestions.has(suggestion.id)}
                  isExpanded={expandedSuggestions.has(suggestion.id)}
                  viewMode={viewMode}
                  onSelect={(selected) => handleSuggestionSelect(suggestion.id, selected)}
                  onExpand={(expanded) => handleSuggestionExpand(suggestion.id, expanded)}
                  onAction={(action) => handleSuggestionAction(suggestion.id, action)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 font-medium mb-2">No suggestions found</p>
                <p className="text-gray-500 text-sm">
                  {filePath ? 'Try adjusting your filters or analyze some code first.' : 'Select a file to get started.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSuggestions.length)} of {filteredSuggestions.length} suggestions
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={twMerge(
                          'px-3 py-1 text-sm rounded-md transition-colors',
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSuggestionsPanel;