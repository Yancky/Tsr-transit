/**
 * TSR APP v1.0 — Composant Alert
 */
import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
  children: ReactNode;
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  className?: string;
}

export function Alert({
  children,
  type = 'info',
  title,
  className = '',
}: AlertProps) {
  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
  };

  const selected = styles[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border text-sm ${selected.bg} ${className}`}
    >
      {selected.icon}
      <div className="flex-1">
        {title && <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5">{title}</h4>}
        <div className="font-medium text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
