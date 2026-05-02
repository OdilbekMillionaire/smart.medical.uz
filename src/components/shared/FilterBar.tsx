import { cn } from '@/lib/utils';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterBarProps {
  options: FilterOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export function FilterBar({ options, value, onChange, className }: FilterBarProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap shrink-0',
            value === opt.key
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
