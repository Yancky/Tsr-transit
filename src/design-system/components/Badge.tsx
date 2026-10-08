/**
 * TSR APP v1.0 — Composant Badge
 */
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'vip' | 'standard' | 'clim' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    vip: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
    standard: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold',
    clim: 'bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
    warning: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
    danger: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
    info: 'bg-blue-100 text-blue-800 border border-blue-300 font-bold',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-semibold',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 uppercase tracking-wider select-none shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
