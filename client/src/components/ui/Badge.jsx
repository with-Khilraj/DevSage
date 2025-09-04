/**
 * Badge Component
 * Glassmorphism design with various styles and states
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'md',
  dot = false,
  icon,
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  // Base styles with glassmorphism
  const baseStyles = `
    inline-flex items-center font-medium
    backdrop-blur-md border
    transition-all duration-200 ease-in-out
    ${removable ? 'pr-1' : ''}
  `;

  // Variant styles
  const variants = {
    default: 'bg-white/10 border-white/20 text-white',
    primary: 'bg-blue-500/20 border-blue-400/30 text-blue-200',
    secondary: 'bg-gray-500/20 border-gray-400/30 text-gray-200',
    success: 'bg-green-500/20 border-green-400/30 text-green-200',
    warning: 'bg-yellow-500/20 border-yellow-400/30 text-yellow-200',
    danger: 'bg-red-500/20 border-red-400/30 text-red-200',
    info: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-200',
    purple: 'bg-purple-500/20 border-purple-400/30 text-purple-200',
    pink: 'bg-pink-500/20 border-pink-400/30 text-pink-200',
    indigo: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200',
    
    // Solid variants
    'solid-primary': 'bg-blue-500 border-blue-600 text-white',
    'solid-success': 'bg-green-500 border-green-600 text-white',
    'solid-warning': 'bg-yellow-500 border-yellow-600 text-white',
    'solid-danger': 'bg-red-500 border-red-600 text-white',
    
    // Outline variants
    'outline-primary': 'bg-transparent border-blue-400 text-blue-400',
    'outline-success': 'bg-transparent border-green-400 text-green-400',
    'outline-warning': 'bg-transparent border-yellow-400 text-yellow-400',
    'outline-danger': 'bg-transparent border-red-400 text-red-400'
  };

  // Size styles
  const sizes = {
    xs: 'px-2 py-0.5 text-xs gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
    xl: 'px-5 py-2 text-base gap-2.5'
  };

  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  // Dot styles
  const dotStyles = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5'
  };

  // Icon styles
  const iconStyles = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5'
  };

  const badgeClasses = twMerge(
    baseStyles,
    variants[variant],
    sizes[size],
    roundedStyles[rounded],
    className
  );

  return (
    <span className={badgeClasses} {...props}>
      {/* Dot indicator */}
      {dot && (
        <span className={twMerge('rounded-full bg-current', dotStyles[size])} />
      )}
      
      {/* Icon */}
      {icon && !dot && (
        <span className={iconStyles[size]}>
          {typeof icon === 'string' ? (
            <span>{icon}</span>
          ) : (
            React.cloneElement(icon, {
              className: twMerge(iconStyles[size], icon.props?.className)
            })
          )}
        </span>
      )}
      
      {/* Content */}
      {children && (
        <span>{children}</span>
      )}
      
      {/* Remove button */}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
        >
          <svg className={iconStyles[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

// Status Badge Component
export const StatusBadge = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
  ...props
}) => {
  const statusConfig = {
    active: { variant: 'success', text: 'Active' },
    inactive: { variant: 'secondary', text: 'Inactive' },
    pending: { variant: 'warning', text: 'Pending' },
    error: { variant: 'danger', text: 'Error' },
    success: { variant: 'success', text: 'Success' },
    processing: { variant: 'primary', text: 'Processing' },
    draft: { variant: 'secondary', text: 'Draft' },
    published: { variant: 'success', text: 'Published' },
    archived: { variant: 'secondary', text: 'Archived' }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showDot}
      className={className}
      {...props}
    >
      {config.text}
    </Badge>
  );
};

// Priority Badge Component
export const PriorityBadge = ({
  priority,
  size = 'md',
  className = '',
  ...props
}) => {
  const priorityConfig = {
    low: { variant: 'success', text: 'Low', icon: '↓' },
    medium: { variant: 'warning', text: 'Medium', icon: '→' },
    high: { variant: 'danger', text: 'High', icon: '↑' },
    critical: { variant: 'solid-danger', text: 'Critical', icon: '⚠️' }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={config.icon}
      className={className}
      {...props}
    >
      {config.text}
    </Badge>
  );
};

// Count Badge Component
export const CountBadge = ({
  count,
  max = 99,
  showZero = false,
  size = 'sm',
  variant = 'danger',
  className = '',
  ...props
}) => {
  if (!showZero && (!count || count === 0)) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant={variant}
      size={size}
      rounded="full"
      className={twMerge('min-w-[1.5rem] justify-center', className)}
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

// Tag Badge Component (for categories, labels, etc.)
export const TagBadge = ({
  children,
  color = 'default',
  size = 'md',
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const colorVariants = {
    default: 'default',
    blue: 'primary',
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    purple: 'purple',
    pink: 'pink',
    indigo: 'indigo',
    cyan: 'info'
  };

  return (
    <Badge
      variant={colorVariants[color] || 'default'}
      size={size}
      rounded="full"
      removable={removable}
      onRemove={onRemove}
      className={className}
      {...props}
    >
      {children}
    </Badge>
  );
};

// Badge Group Component
export const BadgeGroup = ({
  children,
  spacing = 'sm',
  wrap = true,
  className = '',
  ...props
}) => {
  const spacingStyles = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  return (
    <div
      className={twMerge(
        'flex items-center',
        spacingStyles[spacing],
        wrap ? 'flex-wrap' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Notification Badge (for overlaying on other elements)
export const NotificationBadge = ({
  count,
  max = 99,
  showZero = false,
  size = 'sm',
  variant = 'danger',
  position = 'top-right',
  className = '',
  children,
  ...props
}) => {
  if (!showZero && (!count || count === 0)) {
    return children;
  }

  const positionStyles = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <div className="relative inline-block">
      {children}
      <Badge
        variant={variant}
        size={size}
        rounded="full"
        className={twMerge(
          'absolute min-w-[1.25rem] h-5 justify-center',
          positionStyles[position],
          className
        )}
        {...props}
      >
        {displayCount}
      </Badge>
    </div>
  );
};

export default Badge;