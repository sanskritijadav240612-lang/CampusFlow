import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Select dropdown component with standard styling consistent with Input.
 */
export const Select = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder = 'Select an option',
      className,
      id,
      required,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-md shadow-soft">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'block w-full appearance-none rounded-md border text-sm transition-colors duration-150',
              'pl-3 pr-9 py-2 bg-white',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 text-slate-900 hover:border-slate-400 focus:border-campus-600 focus:ring-campus-600/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children ||
              options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
