import { ProductGridSkeleton } from "@/components/products/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-gray-900 to-black">
        <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <Skeleton className="h-12 w-80 rounded bg-white/10" />
            <Skeleton className="h-12 w-64 rounded bg-white/10 mt-3" />
            <Skeleton className="h-6 w-96 rounded bg-white/10 mt-6" />
            <Skeleton className="h-6 w-72 rounded bg-white/10 mt-2" />
            <div className="mt-8 flex gap-3">
              <Skeleton className="h-12 w-36 rounded-lg bg-white/10" />
              <Skeleton className="h-12 w-32 rounded-lg bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features skeleton */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center sm:text-left">
                <Skeleton className="w-12 h-12 rounded-xl mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-32 rounded mt-3 mx-auto sm:mx-0" />
                <Skeleton className="h-3 w-44 rounded mt-2 mx-auto sm:mx-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products skeleton */}
      <section className="bg-gray-50/50">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <Skeleton className="h-8 w-32 rounded mb-2" />
          <Skeleton className="h-5 w-56 rounded mb-8" />
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    </div>
  );
}
