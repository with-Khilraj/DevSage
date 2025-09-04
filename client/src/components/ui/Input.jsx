/**
 * Input Component
 * Glassmorphism design with validation states and various input types
 */

import React, { useState, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  disabled = false,
  required = false,
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  helperText,
  maxLength,
  showCharCount = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Base styles with glassmorphism
  const baseStyles = `
    w-full bg-white/10 backdrop-blur-md border rounded-xl
    text-white placeholder-gray-400
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Size styles
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base'
  };

  // State styles
  const getStateStyles = () => {
    if (error) {
      return 'border-red-400/50 focus:border-red-400 focus:ring-red-400/50 bg-red-500/5';
    }
    if (success) {
      return 'border-green-400/50 focus:border-green-400 focus:ring-green-400/50 bg-green-500/5';
    }
    if (focused) {
      return 'border-blue-400/50 focus:border-blue-400 focus:ring-blue-400/50';
    }
    return 'border-white/20 hover:border-white/30 focus:border-blue-400 focus:ring-blue-400/50';
  };

  // Icon styles
  const iconStyles = 'h-5 w-5 text-gray-400';

  // Handle focus events
  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  // Password visibility toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Character count
  const characterCount = value?.length || 0;
  const isOverLimit = maxLength && characterCount > maxLength;

  const inputClasses = twMerge(
    baseStyles,
    sizes[size],
    getStateStyles(),
    leftIcon || leftElement ? 'pl-10' : '',
    rightIcon || rightElement || type === 'password' ? 'pr-10' : '',
    fullWidth ? 'w-full' : '',
    className
  );

  const containerClasses = twMerge(
    'relative',
    fullWidth ? 'w-full' : '',
    containerClassName
  );

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Left icon/element */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {typeof leftIcon === 'string' ? (
              <span className={iconStyles}>{leftIcon}</span>
            ) : (
              React.cloneElement(leftIcon, { className: twMerge(iconStyles, leftIcon.props?.className) })
            )}
          </div>
        )}
        
        {leftElement && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {leftElement}
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={inputClasses}
          {...props}
        />

        {/* Right icon/element */}
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? (
              <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}

        {rightIcon && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {typeof rightIcon === 'string' ? (
              <span className={iconStyles}>{rightIcon}</span>
            ) : (
              React.cloneElement(rightIcon, { className: twMerge(iconStyles, rightIcon.props?.className) })
            )}
          </div>
        )}
        
        {rightElement && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {/* Helper text, error message, or character count */}
      <div className="mt-2 flex justify-between items-center">
        <div className="flex-1">
          {error && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
          
          {success && !error && (
            <p className="text-green-400 text-sm flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </p>
          )}
          
          {helperText && !error && !success && (
            <p className="text-gray-400 text-sm">{helperText}</p>
          )}
        </div>

        {/* Character count */}
        {showCharCount && maxLength && (
          <p className={twMerge(
            'text-sm ml-2',
            isOverLimit ? 'text-red-400' : 'text-gray-400'
          )}>
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

// Textarea component
export const Textarea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  disabled = false,
  required = false,
  rows = 4,
  resize = 'vertical',
  fullWidth = false,
  helperText,
  maxLength,
  showCharCount = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  const baseStyles = `
    w-full bg-white/10 backdrop-blur-md border rounded-xl
    text-white placeholder-gray-400
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    px-4 py-2.5 text-sm
  `;

  const getStateStyles = () => {
    if (error) {
      return 'border-red-400/50 focus:border-red-400 focus:ring-red-400/50 bg-red-500/5';
    }
    if (success) {
      return 'border-green-400/50 focus:border-green-400 focus:ring-green-400/50 bg-green-500/5';
    }
    if (focused) {
      return 'border-blue-400/50 focus:border-blue-400 focus:ring-blue-400/50';
    }
    return 'border-white/20 hover:border-white/30 focus:border-blue-400 focus:ring-blue-400/50';
  };

  const resizeStyles = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const characterCount = value?.length || 0;
  const isOverLimit = maxLength && characterCount > maxLength;

  const textareaClasses = twMerge(
    baseStyles,
    getStateStyles(),
    resizeStyles[resize],
    fullWidth ? 'w-full' : '',
    className
  );

  const containerClasses = twMerge(
    'relative',
    fullWidth ? 'w-full' : '',
    containerClassName
  );

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />

      {/* Helper text, error message, or character count */}
      <div className="mt-2 flex justify-between items-center">
        <div className="flex-1">
          {error && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
          
          {success && !error && (
            <p className="text-green-400 text-sm flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </p>
          )}
          
          {helperText && !error && !success && (
            <p className="text-gray-400 text-sm">{helperText}</p>
          )}
        </div>

        {/* Character count */}
        {showCharCount && maxLength && (
          <p className={twMerge(
            'text-sm ml-2',
            isOverLimit ? 'text-red-400' : 'text-gray-400'
          )}>
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;