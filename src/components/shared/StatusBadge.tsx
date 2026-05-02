import { cn } from '@/lib/utils';

type StatusVariant =
  | 'draft' | 'pending_review' | 'pending' | 'approved' | 'rejected'
  | 'received' | 'in_review' | 'replied' | 'closed'
  | 'upcoming' | 'overdue' | 'done' | 'active' | 'inactive'
  | 'high' | 'medium' | 'low'
  | 'pass' | 'fail' | 'warning';

const VARIANT_STYLES: Record<StatusVariant, string> = {
  draft:        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  pending:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  pending_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  received:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_review:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  replied:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  closed:       'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  upcoming:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  overdue:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  done:         'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  active:       'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  inactive:     'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  high:         'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium:       'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  low:          'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  pass:         'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  fail:         'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  warning:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, label, className, dot = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_STYLES[status],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-green-500': ['approved', 'done', 'active', 'pass', 'low'].includes(status),
          'bg-red-500': ['rejected', 'overdue', 'fail', 'high'].includes(status),
          'bg-yellow-500': ['pending', 'pending_review', 'upcoming', 'warning', 'medium'].includes(status),
          'bg-orange-500': ['in_review'].includes(status),
          'bg-blue-500': ['received'].includes(status),
          'bg-purple-500': ['replied'].includes(status),
          'bg-slate-400': ['draft', 'closed', 'inactive'].includes(status),
        })} />
      )}
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
