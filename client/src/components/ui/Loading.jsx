/**
 * Loading Components
 * Various loading states with glassmorphism design
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';

// Basic spinner component
export const Spinner = ({
  size = 'md',
  color = 'blue',
  className = '',
  ...props
}) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colors = {
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    white: 'border-white'
  };

  return (
    <div
      className={twMerge(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        sizes[size],
        colors[color],
        className
      )}
      {...props}
    />
  );
};

// Skeleton loader component
export const Skeleton = ({
  width = 'full',
  height = '4',
  rounded = 'md',
  className = '',
  ...props
}) => {
  const widths = {
    '1/4': 'w-1/4',
    '1/2': 'w-1/2',
    '3/4': 'w-3/4',
    'full': 'w-full'
  };

  const heights = {
    '2': 'h-2',
    '3': 'h-3',
    '4': 'h-4',
    '6': 'h-6',
    '8': 'h-8',
    '12': 'h-12',
    '16': 'h-16',
    '20': 'h-20'
  };

  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={twMerge(
        'animate-pulse bg-white/10 backdrop-blur-sm',
        widths[width],
        heights[height],
        roundedStyles[rounded],
        className
      )}
      {...props}
    />
  );
};

// Card skeleton
export const CardSkeleton = ({
  showHeader = true,
  showFooter = false,
  lines = 3,
  className = '',
  ...props
}) => {
  return (
    <div
      className={twMerge(
        'p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl',
        className
      )}
      {...props}
    >
      {showHeader && (
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton width="12" height="12" rounded="full" />
          <div className="space-y-2 flex-1">
            <Skeleton width="1/2" height="4" />
            <Skeleton width="3/4" height="3" />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? '3/4' : 'full'}
            height="3"
          />
        ))}
      </div>
      
      {showFooter && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <Skeleton width="1/4" height="4" />
            <Skeleton width="1/3" height="6" rounded="lg" />
          </div>
        </div>
      )}
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={twMerge(
        'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden',
        className
      )}
      {...props}
    >
      {showHeader && (
        <div className="px-6 py-4 border-b border-white/10">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} width="3/4" height="4" />
            ))}
          </div>
        </div>
      )}
      
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  width={colIndex === 0 ? 'full' : Math.random() > 0.5 ? '3/4' : '1/2'}
                  height="4"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading overlay
export const LoadingOverlay = ({
  message = 'Loading...',
  subMessage,
  className = '',
  ...props
}) => {
  return (
    <div
      className={twMerge(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      <div className="text-center space-y-4 p-8 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl">
        <Spinner size="xl" color="blue" />
        <div className="space-y-2">
          <p className="text-white font-medium">{message}</p>
          {subMessage && (
            <p className="text-gray-400 text-sm">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline loading component
export const InlineLoading = ({
  message = 'Loading...',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <div
      className={twMerge(
        'flex items-center justify-center space-x-3 py-8',
        className
      )}
      {...props}
    >
      <Spinner size={size} color="blue" />
      <span className="text-gray-400">{message}</span>
    </div>
  );
};

// Button loading state
export const ButtonLoading = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };

  return (
    <div
      className={twMerge(
        'animate-spin rounded-full border-2 border-white/30 border-t-white',
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

// Progress bar
export const ProgressBar = ({
  progress = 0,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={twMerge('space-y-2', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">{label || 'Progress'}</span>
          <span className="text-white font-medium">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      
      <div className={twMerge('w-full bg-white/10 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={twMerge(
            'h-full bg-gradient-to-r transition-all duration-300 ease-out',
            colors[color]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default {
  Spinner,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  LoadingOverlay,
  InlineLoading,
  ButtonLoading,
  ProgressBar
};