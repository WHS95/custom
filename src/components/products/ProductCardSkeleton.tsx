import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4 space-y-3">
        <div>
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded mt-2" />
          <Skeleton className="h-4 w-2/3 rounded mt-1" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-5 h-5 rounded-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
