import { Skeleton } from "@/components/ui/skeleton";

export default function MyPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-8 w-48 rounded mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-full h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
