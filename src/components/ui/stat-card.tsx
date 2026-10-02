import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

type StatTone = 'indigo' | 'green' | 'red' | 'amber' | 'slate' | 'blue';

const toneClasses: Record<StatTone, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-sky-50 text-sky-600',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: StatTone;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'indigo',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {Icon ? (
          <div className={cn('rounded-lg p-2.5', toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
