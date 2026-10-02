'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  SHIFT_LENGTH_LABELS,
  ShiftLength,
  WORKER_GENDER_LABELS,
  Worker,
  WorkerGender,
} from '@/types/database';
import { ListFilter, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface WorkerFilterState {
  query: string;
  gender: WorkerGender | '';
  shiftLength: ShiftLength | '';
}

export function filterWorkers(
  workers: Worker[],
  { query, gender, shiftLength }: WorkerFilterState
): Worker[] {
  const normalizedQuery = query.trim().toLowerCase();

  return workers.filter((worker) => {
    if (normalizedQuery && !worker.full_name.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (gender && worker.gender !== gender) {
      return false;
    }
    if (gender === 'female' && shiftLength && worker.shift_length !== shiftLength) {
      return false;
    }
    return true;
  });
}

export function useWorkerSearchFilter(workers: Worker[]) {
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<WorkerGender | ''>('');
  const [shiftLength, setShiftLength] = useState<ShiftLength | ''>('');

  const filteredWorkers = useMemo(
    () => filterWorkers(workers, { query, gender, shiftLength }),
    [workers, query, gender, shiftLength]
  );

  const hasActiveFilters = Boolean(gender);

  function clearFilters() {
    setGender('');
    setShiftLength('');
  }

  function handleGenderChange(value: WorkerGender | '') {
    setGender(value);
    if (value !== 'female') {
      setShiftLength('');
    }
  }

  return {
    query,
    setQuery,
    gender,
    setGender: handleGenderChange,
    shiftLength,
    setShiftLength,
    filteredWorkers,
    hasActiveFilters,
    clearFilters,
  };
}

interface WorkerSearchFilterProps {
  query: string;
  onQueryChange: (value: string) => void;
  gender: WorkerGender | '';
  onGenderChange: (value: WorkerGender | '') => void;
  shiftLength: ShiftLength | '';
  onShiftLengthChange: (value: ShiftLength | '') => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function WorkerSearchFilter({
  query,
  onQueryChange,
  gender,
  onGenderChange,
  shiftLength,
  onShiftLengthChange,
  hasActiveFilters,
  onClearFilters,
}: WorkerSearchFilterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const genderOptions = [
    { value: '', label: 'Barchasi' },
    { value: 'male', label: WORKER_GENDER_LABELS.male },
    { value: 'female', label: WORKER_GENDER_LABELS.female },
  ];

  const shiftLengthOptions = [
    { value: '', label: 'Barchasi' },
    { value: '8', label: SHIFT_LENGTH_LABELS[8] },
    { value: '12', label: SHIFT_LENGTH_LABELS[12] },
  ];

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id="worker-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Ism familiya bo'yicha qidirish"
          className="pl-9"
          autoComplete="off"
        />
      </div>

      <div className="relative" ref={panelRef}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <ListFilter className="mr-2 h-4 w-4" />
          Filtr
          {hasActiveFilters ? (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs text-white">
              {gender === 'female' && shiftLength ? 2 : 1}
            </span>
          ) : null}
        </Button>

        {open && (
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <Select
              id="filter-gender"
              label="Jins"
              value={gender}
              onChange={(e) => {
                const value = e.target.value;
                onGenderChange(value === 'male' || value === 'female' ? value : '');
              }}
              options={genderOptions}
            />
            {gender === 'female' && (
              <div className="mt-3">
                <Select
                  id="filter-shift-length"
                  label="Ish vaqti"
                  value={shiftLength === '' ? '' : String(shiftLength)}
                  onChange={(e) => {
                    const value = e.target.value;
                    onShiftLengthChange(
                      value === '8' || value === '12' ? (Number(value) as ShiftLength) : ''
                    );
                  }}
                  options={shiftLengthOptions}
                />
              </div>
            )}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={onClearFilters}
              >
                Tozalash
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
