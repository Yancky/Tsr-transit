/**
 * TSR APP v1.0 — Composant EmptyState
 */
import { ReactNode } from 'react';
import { BusFront } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-xs max-w-md mx-auto my-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#008751] flex items-center justify-center mb-4">
        {icon || <BusFront className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-black text-slate-800 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
