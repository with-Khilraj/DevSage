/**
 * Card Component
 * Glassmorphism design with various layouts and interactive states
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({
  children,
  variant = 'default',
  size = 'md',
  interactive = false,
  hover = false,
  onClick,
  className = '',
  ...props
}) => {
  // Base glassmorphism styles
  const baseStyles = `
    backdrop-blur-md border rounded-xl
    transition-all duration-200 ease-in-out
    ${interactive || onClick ? 'cursor-pointer' : ''}
    ${hover || interactive || onClick ? 'hover:scale-[1.02] hover:shadow-xl' : ''}
    ${onClick ? 'active:scale-[0.98]' : ''}
  `;

  // Variant styles
  const variants = {
    default: `
      bg-white/10 border-white/20 shadow-lg
      ${hover || interactive || onClick ? 'hover:bg-white/15 hover:border-white/30' : ''}
    `,
    primary: `
      bg-gradient-to-br from-blue-500/20 to-purple-600/20 
      border-blue-400/30 shadow-lg
      ${hover || interactive || onClick ? 'hover:from-blue-500/30 hover:to-purple-600/30' : ''}
    `,
    success: `
      bg-gradient-to-br from-green-500/20 to-emerald-600/20
      border-green-400/30 shadow-lg
      ${hover || interactive || onClick ? 'hover:from-green-500/30 hover:to-emerald-600/30' : ''}
    `,
    warning: `
      bg-gradient-to-br from-yellow-500/20 to-orange-600/20
      border-yellow-400/30 shadow-lg
      ${hover || interactive || onClick ? 'hover:from-yellow-500/30 hover:to-orange-600/30' : ''}
    `,
    danger: `
      bg-gradient-to-br from-red-500/20 to-pink-600/20
      border-red-400/30 shadow-lg
      ${hover || interactive || onClick ? 'hover:from-red-500/30 hover:to-pink-600/30' : ''}
    `,
    glass: `
      bg-white/5 border-white/10 shadow-2xl
      ${hover || interactive || onClick ? 'hover:bg-white/10 hover:border-white/20' : ''}
    `,
    solid: `
      bg-gray-800/90 border-gray-700/50 shadow-xl
      ${hover || interactive || onClick ? 'hover:bg-gray-800 hover:border-gray-600' : ''}
    `
  };

  // Size styles
  const sizes = {
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const cardClasses = twMerge(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header Component
export const CardHeader = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  ...props
}) => {
  return (
    <div className={twMerge('flex items-start justify-between mb-4', className)} {...props}>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-white truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
        {!title && !subtitle && children}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
};

// Card Body Component
export const CardBody = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={twMerge('text-gray-300', className)} {...props}>
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={twMerge('mt-6 pt-4 border-t border-white/10', className)} {...props}>
      {children}
    </div>
  );
};

// Metric Card Component
export const MetricCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend,
  className = '',
  ...props
}) => {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400'
  };

  return (
    <Card variant="default" className={twMerge('relative overflow-hidden', className)} {...props}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold text-white">
            {value}
          </p>
          
          {change && (
            <div className={twMerge('flex items-center text-sm', changeColors[changeType])}>
              {changeType === 'positive' && (
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              )}
              {changeType === 'negative' && (
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                </svg>
              )}
              {change}
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Trend</span>
              <span>{trend.period}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-500"
                style={{ width: `${trend.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Feature Card Component
export const FeatureCard = ({
  icon,
  title,
  description,
  action,
  status,
  className = '',
  ...props
}) => {
  const statusColors = {
    active: 'text-green-400 bg-green-400/20',
    inactive: 'text-gray-400 bg-gray-400/20',
    pending: 'text-yellow-400 bg-yellow-400/20',
    error: 'text-red-400 bg-red-400/20'
  };

  return (
    <Card 
      variant="default" 
      interactive={!!action}
      className={twMerge('group', className)} 
      {...props}
    >
      <div className="flex items-start space-x-4">
        {icon && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-200">
              {icon}
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {title}
            </h3>
            {status && (
              <span className={twMerge(
                'px-2 py-1 rounded-full text-xs font-medium',
                statusColors[status]
              )}>
                {status}
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-gray-400 text-sm leading-relaxed">
              {description}
            </p>
          )}
          
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Grid layout for cards
export const CardGrid = ({
  children,
  cols = 'auto',
  gap = 'md',
  className = '',
  ...props
}) => {
  const colsStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gapStyles = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div 
      className={twMerge(
        'grid',
        colsStyles[cols],
        gapStyles[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;