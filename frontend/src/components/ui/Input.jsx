import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Input component with integrated label, helper text, error state, and icon slots.
 */
export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-md shadow-soft">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'block w-full rounded-md border text-sm transition-colors duration-150',
              'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              LeftIcon ? 'pl-9' : 'pl-3',
              RightIcon ? 'pr-9' : 'pr-3',
              'py-2',
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 text-slate-900 hover:border-slate-400 focus:border-campus-600 focus:ring-campus-600/20',
              className
            )}
            {...props}
          />
          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <RightIcon className="w-4 h-4" />
            </div>
          )}
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

Input.displayName = 'Input';
export default Input;
