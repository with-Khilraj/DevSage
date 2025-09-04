/**
 * Button Component
 * Glassmorphism design with multiple variants and states
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Base styles with glassmorphism
  const baseStyles = `
    relative inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 ease-in-out transform
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    backdrop-blur-md border
    ${fullWidth ? 'w-full' : ''}
    ${loading || disabled ? 'pointer-events-none' : 'hover:scale-105 active:scale-95'}
  `;

  // Variant styles
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-500/80 to-purple-600/80 
      hover:from-blue-600/90 hover:to-purple-700/90
      border-white/20 text-white shadow-lg
      focus:ring-blue-500/50
    `,
    secondary: `
      bg-white/10 hover:bg-white/20 
      border-white/20 text-white shadow-lg
      focus:ring-white/50
    `,
    success: `
      bg-gradient-to-r from-green-500/80 to-emerald-600/80
      hover:from-green-600/90 hover:to-emerald-700/90
      border-white/20 text-white shadow-lg
      focus:ring-green-500/50
    `,
    danger: `
      bg-gradient-to-r from-red-500/80 to-pink-600/80
      hover:from-red-600/90 hover:to-pink-700/90
      border-white/20 text-white shadow-lg
      focus:ring-red-500/50
    `,
    warning: `
      bg-gradient-to-r from-yellow-500/80 to-orange-600/80
      hover:from-yellow-600/90 hover:to-orange-700/90
      border-white/20 text-white shadow-lg
      focus:ring-yellow-500/50
    `,
    ghost: `
      bg-transparent hover:bg-white/10
      border-white/20 text-white
      focus:ring-white/50
    `,
    outline: `
      bg-transparent hover:bg-white/5
      border-white/40 text-white
      focus:ring-white/50
    `
  };

  // Size styles
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3'
  };

  // Loading spinner component
  const LoadingSpinner = ({ size }) => {
    const spinnerSizes = {
      xs: 'h-3 w-3',
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6'
    };

    return (
      <div className={`animate-spin rounded-full border-2 border-white/30 border-t-white ${spinnerSizes[size]}`} />
    );
  };

  // Icon component
  const IconComponent = ({ icon, position }) => {
    if (!icon) return null;
    
    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6'
    };

    if (typeof icon === 'string') {
      return <span className={`${iconSizes[size]} flex items-center justify-center`}>{icon}</span>;
    }

    return React.cloneElement(icon, {
      className: twMerge(iconSizes[size], icon.props?.className)
    });
  };

  const buttonClasses = twMerge(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={buttonClasses}
      {...props}
    >
      {/* Loading state */}
      {loading && (
        <LoadingSpinner size={size} />
      )}
      
      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <IconComponent icon={icon} position="left" />
      )}
      
      {/* Button content */}
      {!loading && children && (
        <span className="relative z-10">{children}</span>
      )}
      
      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <IconComponent icon={icon} position="right" />
      )}

      {/* Glassmorphism overlay effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
};

// Button group component for related actions
export const ButtonGroup = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={twMerge(
        'inline-flex rounded-xl overflow-hidden backdrop-blur-md border border-white/20',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: twMerge(
              child.props.className,
              'rounded-none border-0',
              index > 0 && 'border-l border-white/20'
            )
          });
        }
        return child;
      })}
    </div>
  );
};

// Icon button variant
export const IconButton = ({
  icon,
  size = 'md',
  variant = 'secondary',
  tooltip,
  ...props
}) => {
  const iconSizes = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
    xl: 'p-4'
  };

  return (
    <Button
      variant={variant}
      className={twMerge('aspect-square', iconSizes[size])}
      title={tooltip}
      {...props}
    >
      {icon}
    </Button>
  );
};

// Floating Action Button
export const FloatingActionButton = ({
  icon,
  onClick,
  variant = 'primary',
  size = 'lg',
  className = '',
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={twMerge(
        'fixed bottom-6 right-6 z-50 rounded-full shadow-2xl aspect-square',
        'hover:shadow-3xl transform hover:scale-110 active:scale-95',
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;