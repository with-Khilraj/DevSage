/**
 * Suggestion Filters Component
 * Advanced filtering sidebar with real-time updates
 */

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Button, Input, Checkbox, Badge, Card } from '../ui';

const SuggestionFilters = ({
  filters,
  onFilterChange,
  suggestions = [],
  stats,
  onRefresh,
  isLoading = false,
  className = '',
  ...props
}) => {
  const [savedFilters, setSavedFilters] = useState([
    { name: 'Critical Issues', filters: { severity: ['critical'], type: [], status: ['pending'] } },
    { name: 'Security Concerns', filters: { severity: [], type: ['security'], status: ['pending'] } },
    { name: 'Quick Wins', filters: { severity: ['low', 'medium'], type: [], status: ['pending'] } }
  ]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  // Handle array filter toggle
  const handleArrayFilterToggle = (key, value) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray);
  };

  // Apply saved filter preset
  const applySavedFilter = (savedFilter) => {
    onFilterChange(savedFilter.filters);
  };

  // Save current filter as preset
  const saveCurrentFilter = () => {
    const name = prompt('Enter a name for this filter preset:');
    if (name && name.trim()) {
      setSavedFilters(prev => [...prev, {
        name: name.trim(),
        filters: { ...filters }
      }]);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFilterChange({
      severity: [],
      type: [],
      status: ['pending'],
      minConfidence: 0.5,
      searchQuery: '',
      dateRange: null,
      showApplied: false
    });
  };

  // Get count for filter option
  const getFilterCount = (key, value) => {
    if (!suggestions.length) return 0;
    
    switch (key) {
      case 'severity':
        return suggestions.filter(s => s.severity === value).length;
      case 'type':
        return suggestions.filter(s => s.type === value).length;
      case 'status':
        return suggestions.filter(s => (s.status || 'pending') === value).length;
      default:
        return 0;
    }
  };

  return (
    <div className={twMerge('h-full flex flex-col bg-white/5 backdrop-blur-sm', className)} {...props}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2"
          >
            <svg className={twMerge('h-4 w-4', isLoading && 'animate-spin')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search suggestions..."
          value={filters.searchQuery || ''}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          className="mb-3"
        />

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={saveCurrentFilter}
            className="text-xs"
          >
            Save Filter
          </Button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Saved Filter Presets */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Quick Filters</h4>
            <div className="space-y-2">
              {savedFilters.map((savedFilter, index) => (
                <button
                  key={index}
                  onClick={() => applySavedFilter(savedFilter)}
                  className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm text-white">{savedFilter.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Severity</h4>
            <div className="space-y-2">
              {['critical', 'high', 'medium', 'low'].map((severity) => {
                const count = getFilterCount('severity', severity);
                const isChecked = (filters.severity || []).includes(severity);
                
                return (
                  <label key={severity} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleArrayFilterToggle('severity', severity)}
                      />
                      <span className={twMerge(
                        'text-sm capitalize',
                        isChecked ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      )}>
                        {severity}
                      </span>
                    </div>
                    <Badge
                      variant={
                        severity === 'critical' ? 'danger' :
                        severity === 'high' ? 'warning' :
                        severity === 'medium' ? 'info' : 'secondary'
                      }
                      size="xs"
                    >
                      {count}
                    </Badge>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Type</h4>
            <div className="space-y-2">
              {['security', 'performance', 'maintainability', 'style'].map((type) => {
                const count = getFilterCount('type', type);
                const isChecked = (filters.type || []).includes(type);
                
                return (
                  <label key={type} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleArrayFilterToggle('type', type)}
                      />
                      <div className="flex items-center space-x-2">
                        {/* Type Icon */}
                        {type === 'security' && (
                          <svg className="h-3 w-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        {type === 'performance' && (
                          <svg className="h-3 w-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {type === 'maintainability' && (
                          <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                        {type === 'style' && (
                          <svg className="h-3 w-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v7z" />
                          </svg>
                        )}
                        <span className={twMerge(
                          'text-sm capitalize',
                          isChecked ? 'text-white' : 'text-gray-300 group-hover:text-white'
                        )}>
                          {type}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline-primary" size="xs">
                      {count}
                    </Badge>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Status</h4>
            <div className="space-y-2">
              {['pending', 'accepted', 'rejected', 'applied'].map((status) => {
                const count = getFilterCount('status', status);
                const isChecked = (filters.status || []).includes(status);
                
                return (
                  <label key={status} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleArrayFilterToggle('status', status)}
                      />
                      <span className={twMerge(
                        'text-sm capitalize',
                        isChecked ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      )}>
                        {status}
                      </span>
                    </div>
                    <Badge
                      variant={
                        status === 'applied' ? 'success' :
                        status === 'accepted' ? 'info' :
                        status === 'rejected' ? 'danger' : 'secondary'
                      }
                      size="xs"
                    >
                      {count}
                    </Badge>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Confidence Filter */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Minimum Confidence</h4>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.minConfidence || 0.5}
                onChange={(e) => handleFilterChange('minConfidence', parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span className="text-white font-medium">
                  {Math.round((filters.minConfidence || 0.5) * 100)}%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Advanced</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.showApplied || false}
                  onChange={(checked) => handleFilterChange('showApplied', checked)}
                />
                <span className="text-sm text-gray-300">Show applied suggestions</span>
              </label>
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Date Range</h4>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="From date"
                value={filters.dateRange?.from || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  from: e.target.value
                })}
                size="sm"
              />
              <Input
                type="date"
                placeholder="To date"
                value={filters.dateRange?.to || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  to: e.target.value
                })}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Total Suggestions: {suggestions.length}</div>
          <div>Active Filters: {
            Object.values(filters).filter(value => 
              Array.isArray(value) ? value.length > 0 : 
              typeof value === 'string' ? value.length > 0 :
              typeof value === 'boolean' ? value :
              typeof value === 'number' ? value !== 0.5 :
              value !== null
            ).length
          }</div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionFilters;