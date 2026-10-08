/**
 * TSR APP v1.0 — Composant Input
 */
import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isPhoneBurkina?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPhoneBurkina = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label ? label?.toLowerCase().replace(/\s+/g, '-') : undefined;

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {isPhoneBurkina && (
            <div className="absolute left-3 flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 select-none z-10">
              <span className="text-sm">🇧🇫</span>
              <span>+226</span>
            </div>
          )}

          {!isPhoneBurkina && leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`
              w-full h-12 bg-white text-slate-900 text-sm font-medium rounded-xl border transition-all duration-200
              placeholder:text-slate-400 focus:outline-none focus:ring-2
              ${
                error
                  ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-[#008751] focus:ring-[#008751]/20'
              }
              ${isPhoneBurkina ? 'pl-24 pr-4' : leftIcon ? 'pl-11 pr-4' : 'px-4'}
              ${rightIcon ? 'pr-11' : ''}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
