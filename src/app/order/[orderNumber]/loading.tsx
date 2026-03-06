import { Skeleton } from "@/components/ui/skeleton";

export default function OrderLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="w-24 h-8 rounded" />
            <div>
              <Skeleton className="w-32 h-5 rounded" />
              <Skeleton className="w-20 h-4 rounded mt-1" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[calc(100vh-64px)]">
        <div className="hidden lg:block w-80 bg-white border-r p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-24 rounded-xl" />
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-full max-w-[500px] aspect-square rounded-xl mx-8" />
        </div>
        <div className="hidden lg:block w-72 bg-white border-l p-4 space-y-4">
          <Skeleton className="w-full h-10 rounded" />
          <Skeleton className="w-full h-10 rounded" />
          <Skeleton className="w-full h-32 rounded" />
        </div>
      </div>
    </div>
  );
}
