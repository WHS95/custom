"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/products";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, ShoppingCart } from "lucide-react";
import type { Product } from "@/domain/product/types";
import { useCartStore } from "@/lib/store/cart-store";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        if (json.success) {
          setProducts(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <div>
            <h1 className='text-xl font-bold'>상품 목록</h1>
            <p className='text-sm text-gray-500'></p>
          </div>
          {/* <div className='flex gap-2'>
            <Link href='/cart'>
              <Button variant='outline' className='relative'>
                <ShoppingCart className='h-4 w-4 mr-2' />
                장바구니
                {cartItems.length > 0 && (
                  <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </Link>
          </div> */}
        </div>
      </header>

      {/* Main Content */}
      <main className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          {/* <h2 className='text-2xl font-bold mb-2'>상품 선택</h2>
          <p className='text-gray-600'>커스텀하고 싶은 상품을 선택하세요</p> */}
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-16'>
            <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </main>

      {/* Footer */}
      <footer className='bg-white border-t mt-auto py-8'>
        <div className='container mx-auto px-4 text-center text-sm text-gray-500'>
          <p>Custom Hat Service by RunHouse</p>
        </div>
      </footer>
    </div>
  );
}
