/**
 * Checkbox Component
 * Customizable checkbox with various states and styles
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';

const Checkbox = ({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  variant = 'primary',
  className = '',
  labelClassName = '',
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Variant classes
  const variantClasses = {
    primary: 'text-blue-500 focus:ring-blue-500',
    success: 'text-green-500 focus:ring-green-500',
    danger: 'text-red-500 focus:ring-red-500',
    warning: 'text-yellow-500 focus:ring-yellow-500',
    info: 'text-cyan-500 focus:ring-cyan-500'
  };

  const checkboxClasses = twMerge(
    'rounded border-gray-300 bg-white/10 border-white/20 focus:ring-2 focus:ring-offset-0 transition-colors',
    sizeClasses[size],
    variantClasses[variant],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const labelClasses = twMerge(
    'text-gray-300',
    size === 'sm' && 'text-sm',
    size === 'md' && 'text-sm',
    size === 'lg' && 'text-base',
    disabled && 'opacity-50 cursor-not-allowed',
    labelClassName
  );

  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.checked, e);
    }
  };

  // Handle indeterminate state
  React.useEffect(() => {
    const checkbox = document.getElementById(props.id || `checkbox-${Math.random()}`);
    if (checkbox) {
      checkbox.indeterminate = indeterminate;
    }
  }, [indeterminate, props.id]);

  const checkboxId = props.id || `checkbox-${Math.random()}`;

  if (label || description) {
    return (
      <div className="flex items-start space-x-2">
        <input
          {...props}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={checkboxClasses}
        />
        <div className="flex-1">
          {label && (
            <label htmlFor={checkboxId} className={twMerge('block cursor-pointer', labelClasses)}>
              {label}
            </label>
          )}
          {description && (
            <p className={twMerge('text-xs text-gray-400 mt-1', disabled && 'opacity-50')}>
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <input
      {...props}
      id={checkboxId}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className={checkboxClasses}
    />
  );
};

// Checkbox Group Component
export const CheckboxGroup = ({
  options = [],
  value = [],
  onChange,
  disabled = false,
  size = 'md',
  variant = 'primary',
  direction = 'vertical',
  className = '',
  ...props
}) => {
  const handleCheckboxChange = (optionValue, checked) => {
    if (!onChange) return;

    const newValue = checked
      ? [...value, optionValue]
      : value.filter(v => v !== optionValue);
    
    onChange(newValue);
  };

  const groupClasses = twMerge(
    'space-y-2',
    direction === 'horizontal' && 'flex flex-wrap gap-4 space-y-0',
    className
  );

  return (
    <div className={groupClasses} {...props}>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        const optionDescription = typeof option === 'object' ? option.description : undefined;
        const optionDisabled = disabled || (typeof option === 'object' ? option.disabled : false);

        return (
          <Checkbox
            key={optionValue}
            checked={value.includes(optionValue)}
            onChange={(checked) => handleCheckboxChange(optionValue, checked)}
            disabled={optionDisabled}
            label={optionLabel}
            description={optionDescription}
            size={size}
            variant={variant}
          />
        );
      })}
    </div>
  );
};

export default Checkbox;