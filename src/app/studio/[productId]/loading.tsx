import { Skeleton } from "@/components/ui/skeleton";

export default function StudioLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
        <Skeleton className="h-4 w-32 rounded mx-auto" />
      </div>
    </div>
  );
}
