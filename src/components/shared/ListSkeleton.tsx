import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableRowSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableRowSkeleton({ columns = 5, rows = 8 }: TableRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-border">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-6 py-4">
              <Skeleton
                className={cn("h-4 rounded", colIdx === 0 ? "w-3/4" : "w-1/2")}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 6, className }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "p-5 rounded-xl bg-card border border-border animate-pulse",
            className,
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-border">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </>
  );
}

interface KanbanCardSkeletonProps {
  count?: number;
}

export function KanbanCardSkeleton({ count = 3 }: KanbanCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-card border border-border animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-5 w-24 mt-2" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
      ))}
    </>
  );
}
