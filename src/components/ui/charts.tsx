import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface ChartBar {
  label: string;
  value: number;
  color?: string;
}

function ChartCard({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DonutChart({
  title,
  hint,
  slices,
  centerLabel,
  formatValue = String,
}: {
  title: string;
  hint?: string;
  slices: ChartSlice[];
  centerLabel?: string;
  formatValue?: (value: number) => string;
}) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const size = 192;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <ChartCard title={title} hint={hint}>
      {total === 0 ? (
        <EmptyState title="Ma’lumot yo‘q" className="px-0 py-10" />
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-44 w-44 shrink-0">
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={stroke}
              />
              {slices.map((slice) => {
                if (slice.value <= 0) return null;
                const length = (slice.value / total) * circumference;
                const circle = (
                  <circle
                    key={slice.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                    className="chart-donut-arc"
                  />
                );
                offset += length;
                return circle;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-semibold tabular-nums text-slate-900">
                {formatValue(total)}
              </span>
              {centerLabel ? (
                <span className="mt-0.5 text-xs text-slate-500">{centerLabel}</span>
              ) : null}
            </div>
          </div>
          <ul className="w-full min-w-0 space-y-2.5">
            {slices.map((slice) => {
              const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
              return (
                <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate">{slice.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-900">
                    {formatValue(slice.value)}
                    <span className="ml-1.5 text-xs text-slate-400">{pct}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

export function ColumnChart({
  title,
  hint,
  items,
  formatValue = String,
}: {
  title: string;
  hint?: string;
  items: ChartSlice[];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);

  return (
    <ChartCard title={title} hint={hint}>
      {items.every((item) => item.value === 0) ? (
        <EmptyState title="Ma’lumot yo‘q" className="px-0 py-10" />
      ) : (
        <div className="flex h-56 items-end gap-3 sm:gap-5">
          {items.map((item) => {
            const height = Math.max(6, (Math.abs(item.value) / max) * 100);
            return (
              <div
                key={item.label}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="max-w-full truncate text-center text-[11px] font-medium tabular-nums text-slate-700">
                  {formatValue(item.value)}
                </span>
                <div className="flex h-40 w-full items-end justify-center">
                  <div
                    className="chart-col w-[72%] max-w-14 rounded-t-lg"
                    style={{
                      height: `${height}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

export function BarListChart({
  title,
  hint,
  items,
  color = '#4f46e5',
  formatValue = String,
}: {
  title: string;
  hint?: string;
  items: ChartBar[];
  color?: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ChartCard title={title} hint={hint}>
      {items.length === 0 ? (
        <EmptyState title="Ma’lumot yo‘q" className="px-0 py-10" />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-slate-700">{item.label}</span>
                <span className="shrink-0 tabular-nums font-medium text-slate-900">
                  {formatValue(item.value)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn('chart-bar h-full rounded-full')}
                  style={{
                    width: `${Math.max(3, (item.value / max) * 100)}%`,
                    backgroundColor: item.color ?? color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
