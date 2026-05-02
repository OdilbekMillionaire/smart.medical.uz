import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonListProps {
  count?: number;
  /** Tailwind height class, e.g. "h-20" (default) or "h-28" for card skeletons */
  height?: string;
  className?: string;
}

export function SkeletonList({ count = 3, height = 'h-20', className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn(height, 'w-full rounded-xl')} />
      ))}
    </div>
  );
}
