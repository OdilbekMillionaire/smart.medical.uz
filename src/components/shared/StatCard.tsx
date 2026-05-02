import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: number | string | null;
  icon: React.ReactNode;
  /** Full Tailwind border + bg classes, e.g. "border-l-blue-500 bg-blue-50/30" */
  colorClass: string;
  /** Full Tailwind text color for the icon wrapper, e.g. "text-blue-600" */
  iconClass: string;
  href?: string;
  className?: string;
}

function StatCardInner({ label, value, icon, colorClass, iconClass, className }: Omit<StatCardProps, 'href'>) {
  return (
    <Card className={cn('border-l-4 hover:shadow-md transition-all', colorClass, className)}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {value === null
            ? <Skeleton className="h-8 w-16 mt-1" />
            : <p className="text-3xl font-bold mt-1">{value}</p>}
        </div>
        <div className={cn('rounded-xl bg-white/80 p-3 shadow-sm', iconClass)}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCard({ href, ...props }: StatCardProps) {
  if (href) {
    return (
      <Link href={href}>
        <StatCardInner {...props} />
      </Link>
    );
  }
  return <StatCardInner {...props} />;
}
