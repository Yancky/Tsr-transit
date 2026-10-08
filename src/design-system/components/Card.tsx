/**
 * TSR APP v1.0 — Composant Card
 */
import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'highlight';
  interactive?: boolean;
}

export function Card({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-slate-100 shadow-sm',
    elevated: 'bg-white shadow-md border border-slate-100',
    outlined: 'bg-white border-2 border-slate-200',
    highlight: 'bg-emerald-50/50 border-2 border-[#008751]/30 shadow-sm',
  };

  const interactiveStyles = interactive
    ? 'hover:border-[#008751]/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
