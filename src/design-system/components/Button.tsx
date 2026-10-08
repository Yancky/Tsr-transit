/**
 * TSR APP v1.0 — Composant Button
 */
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl tracking-wide';

  const sizeStyles = {
    sm: 'text-xs px-3 py-2 gap-1.5 h-9',
    md: 'text-sm px-4 py-2.5 gap-2 h-11',
    lg: 'text-base px-6 py-3.5 gap-2.5 h-13 shadow-sm',
  };

  const variantStyles = {
    primary:
      'bg-[#008751] text-white hover:bg-[#00683e] active:bg-[#005231] shadow-emerald-900/10 shadow',
    accent:
      'bg-[#fcd116] text-[#0f172a] hover:bg-[#e5bd0c] font-black shadow-amber-900/10 shadow',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
    outline:
      'border-2 border-[#008751] text-[#008751] bg-transparent hover:bg-emerald-50 active:bg-emerald-100',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200',
  };

  return (
    <button
      className={`
        ${baseStyles} 
        ${sizeStyles[size]} 
        ${variantStyles[variant]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
