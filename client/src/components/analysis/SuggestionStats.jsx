/**
 * Suggestion Statistics Component
 * Dashboard showing suggestion statistics and metrics
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Card, Badge } from '../ui';

const SuggestionStats = ({
  stats,
  className = '',
  ...props
}) => {
  if (!stats) {
    return null;
  }

  // Calculate percentages
  const getPercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'security':
        return 'text-red-400 bg-red-500/20';
      case 'performance':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'maintainability':
        return 'text-blue-400 bg-blue-500/20';
      case 'style':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className={twMerge('grid grid-cols-2 lg:grid-cols-4 gap-4', className)} {...props}>
      {/* Overview Stats */}
      <Card variant="glass" className="p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Suggestions</div>
        </div>
      </Card>

      <Card variant="glass" className="p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-400">Pending Review</div>
          <div className="text-xs text-gray-500 mt-1">
            {getPercentage(stats.pending, stats.total)}% of total
          </div>
        </div>
      </Card>

      <Card variant="glass" className="p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.applied}</div>
          <div className="text-sm text-gray-400">Applied</div>
          <div className="text-xs text-gray-500 mt-1">
            {getPercentage(stats.applied, stats.total)}% of total
          </div>
        </div>
      </Card>

      <Card variant="glass" className="p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {Math.round(stats.averageConfidence * 100)}%
          </div>
          <div className="text-sm text-gray-400">Avg Confidence</div>
        </div>
      </Card>

      {/* Severity Breakdown */}
      <Card variant="glass" className="p-4 lg:col-span-2">
        <h3 className="text-sm font-medium text-white mb-3">Severity Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(stats.severityBreakdown || {}).map(([severity, count]) => {
            const percentage = getPercentage(count, stats.total);
            return (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={twMerge('w-3 h-3 rounded-full', getSeverityColor(severity))}></div>
                  <span className="text-sm text-gray-300 capitalize">{severity}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white font-medium">{count}</span>
                  <span className="text-xs text-gray-400">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Severity Progress Bars */}
        <div className="mt-4 space-y-2">
          {Object.entries(stats.severityBreakdown || {}).map(([severity, count]) => {
            const percentage = getPercentage(count, stats.total);
            return (
              <div key={severity} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 capitalize">{severity}</span>
                  <span className="text-gray-400">{percentage}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={twMerge('h-2 rounded-full transition-all duration-300', getSeverityColor(severity))}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Type Breakdown */}
      <Card variant="glass" className="p-4 lg:col-span-2">
        <h3 className="text-sm font-medium text-white mb-3">Type Distribution</h3>
        <div className="space-y-2">
          {Object.entries(stats.typeBreakdown || {}).map(([type, count]) => {
            const percentage = getPercentage(count, stats.total);
            return (
              <div key={type} className="flex items-center justify-between">
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
                  <span className="text-sm text-gray-300 capitalize">{type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white font-medium">{count}</span>
                  <span className="text-xs text-gray-400">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Type Progress Bars */}
        <div className="mt-4 space-y-2">
          {Object.entries(stats.typeBreakdown || {}).map(([type, count]) => {
            const percentage = getPercentage(count, stats.total);
            return (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 capitalize">{type}</span>
                  <span className="text-gray-400">{percentage}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={twMerge('h-2 rounded-full transition-all duration-300', getTypeColor(type))}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Status Overview */}
      <Card variant="glass" className="p-4 lg:col-span-4">
        <h3 className="text-sm font-medium text-white mb-3">Status Overview</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400 mb-1">{stats.pending}</div>
            <div className="text-xs text-gray-400">Pending</div>
            <div className="text-xs text-gray-500">{getPercentage(stats.pending, stats.total)}%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400 mb-1">{stats.accepted}</div>
            <div className="text-xs text-gray-400">Accepted</div>
            <div className="text-xs text-gray-500">{getPercentage(stats.accepted, stats.total)}%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-400 mb-1">{stats.rejected}</div>
            <div className="text-xs text-gray-400">Rejected</div>
            <div className="text-xs text-gray-500">{getPercentage(stats.rejected, stats.total)}%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400 mb-1">{stats.applied}</div>
            <div className="text-xs text-gray-400">Applied</div>
            <div className="text-xs text-gray-500">{getPercentage(stats.applied, stats.total)}%</div>
          </div>
        </div>

        {/* Status Progress Bar */}
        <div className="mt-4">
          <div className="flex h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="bg-yellow-500 transition-all duration-300"
              style={{ width: `${getPercentage(stats.pending, stats.total)}%` }}
              title={`Pending: ${stats.pending}`}
            ></div>
            <div
              className="bg-blue-500 transition-all duration-300"
              style={{ width: `${getPercentage(stats.accepted, stats.total)}%` }}
              title={`Accepted: ${stats.accepted}`}
            ></div>
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${getPercentage(stats.rejected, stats.total)}%` }}
              title={`Rejected: ${stats.rejected}`}
            ></div>
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${getPercentage(stats.applied, stats.total)}%` }}
              title={`Applied: ${stats.applied}`}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Pending</span>
            <span>Accepted</span>
            <span>Rejected</span>
            <span>Applied</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuggestionStats;