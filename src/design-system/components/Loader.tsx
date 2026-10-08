/**
 * TSR APP v1.0 — Composant Loader & Skeleton
 */
import { Bus } from 'lucide-react';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loader({ message = 'Chargement en cours...', size = 'md' }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-14 h-14 rounded-full border-4 border-emerald-100 border-t-[#008751] animate-spin" />
        <Bus className="w-6 h-6 text-[#008751] absolute animate-pulse" />
      </div>
      <p className="text-xs font-bold text-slate-600 tracking-wide">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-xs animate-pulse">
      <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-3" />
      <div className="h-7 bg-slate-200 rounded-md w-2/3 mb-4" />
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className="h-4 bg-slate-200 rounded-md w-1/4" />
        <div className="h-9 bg-slate-200 rounded-xl w-24" />
      </div>
    </div>
  );
}
