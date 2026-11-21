import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Button component supporting distinct editorial variants, sizes, loading states, and icon slots.
 */
export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-campus-700 text-white hover:bg-campus-800 active:bg-campus-900 shadow-soft',
      secondary:
        'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-soft',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-soft',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-soft',
      dangerOutline:
        'border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 active:bg-rose-100',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : LeftIcon ? (
          <LeftIcon className="w-4 h-4 shrink-0" />
        ) : null}
        <span>{children}</span>
        {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
