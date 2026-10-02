import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('px-6 py-14 text-center', className)}>
      {Icon ? (
        <Icon className="mx-auto h-10 w-10 text-slate-300" />
      ) : null}
      <p className={cn('text-sm font-medium text-slate-600', Icon && 'mt-3')}>
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}
