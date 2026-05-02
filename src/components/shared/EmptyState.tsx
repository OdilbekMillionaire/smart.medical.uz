import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'py-16 text-center bg-white rounded-xl border border-dashed border-slate-200',
      className
    )}>
      <div className="w-12 h-12 mx-auto mb-3 text-slate-300 flex items-center justify-center">
        {icon}
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
