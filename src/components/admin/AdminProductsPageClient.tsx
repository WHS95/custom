"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdminProductCard from "@/components/admin/products/ProductCard";
import ProductFormDialog from "@/components/admin/products/ProductFormDialog";
import { toast } from "sonner";
import { Plus, Package, ArrowLeft, Loader2 } from "lucide-react";
import type { Product } from "@/domain/product/types";

interface AdminProductsPageClientProps {
  tenantSlugParam: string;
  initialProducts: Product[];
}

export function AdminProductsPageClient({
  tenantSlugParam,
  initialProducts,
}: AdminProductsPageClientProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: authLoading,
    tenantSlug,
  } = useAdminAuth();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const useInitialDataRef = useRef(true);

  const basePath = `/admin/${tenantSlugParam}`;

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login");
      } else if (tenantSlug && tenantSlug !== tenantSlugParam) {
        router.push(`/admin/${tenantSlug}/products`);
      }
    }
  }, [authLoading, isAuthenticated, tenantSlug, tenantSlugParam, router]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/products?includeInactive=true");
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("상품 목록을 불러오지 못했습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (useInitialDataRef.current) {
      useInitialDataRef.current = false;
      return;
    }
    fetchProducts();
  }, [fetchProducts, isAuthenticated]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("상품이 삭제되었습니다");
        fetchProducts();
      } else {
        toast.error(json.error || "삭제 실패");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          product.isActive
            ? "상품이 비활성화되었습니다"
            : "상품이 활성화되었습니다",
        );
        fetchProducts();
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className='container mx-auto py-8 flex items-center justify-center min-h-[400px]'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-gray-400' />
          <p className='text-gray-500'>상품 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='flex justify-between items-center mb-8'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push(`${basePath}/dashboard`)}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>상품 관리</h1>
            <p className='text-gray-500'>
              <span className='font-medium text-blue-600'>
                [{tenantSlugParam}]
              </span>{" "}
              상품을 추가, 수정, 삭제할 수 있습니다.
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className='mr-2 h-4 w-4' /> 새 상품 추가
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className='py-16 text-center'>
            <Package className='h-16 w-16 mx-auto text-gray-300 mb-4' />
            <p className='text-gray-500 mb-4'>등록된 상품이 없습니다</p>
            <Button onClick={handleOpenCreate}>
              <Plus className='mr-2 h-4 w-4' /> 첫 상품 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {products.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              tenantSlug={tenantSlugParam}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingProduct={editingProduct}
        onSaved={fetchProducts}
      />
    </div>
  );
}
