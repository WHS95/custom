"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PriceTier } from "@/domain/product/types";
import { sortPriceTiers } from "@/lib/pricing/price-calculator";

interface PricingTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  basePrice: number;
  priceTiers: PriceTier[];
}

export function PricingTableModal({
  open,
  onOpenChange,
  productName,
  basePrice,
  priceTiers,
}: PricingTableModalProps) {
  const sorted = sortPriceTiers(priceTiers);
  const lastTierIndex = sorted.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[700px] p-0 gap-0 overflow-hidden'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-xl font-bold'>할인 가격표</DialogTitle>
        </DialogHeader>

        {/* 가격표 테이블 */}
        <div className='px-6 overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b-2 border-gray-200'>
                <th className='text-left py-3 pr-4 text-sm font-bold text-gray-700 whitespace-nowrap'>
                  주문 수량 (개)
                </th>
                {sorted.map((tier, idx) => (
                  <th
                    key={tier.minQuantity}
                    className={`py-3 px-2 text-center text-sm font-bold whitespace-nowrap ${
                      idx === lastTierIndex ? "text-blue-400" : "text-gray-700"
                    }`}
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span>{tier.minQuantity.toLocaleString()}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className='border-b border-gray-100'>
                <td className='py-4 pr-4 text-sm font-bold text-gray-700 whitespace-nowrap'>
                  개당 가격 (원)
                </td>
                {sorted.map((tier, idx) => {
                  const discountRate =
                    basePrice > 0
                      ? Math.round(
                          ((basePrice - tier.unitPrice) / basePrice) * 100,
                        )
                      : 0;
                  return (
                    <td
                      key={tier.minQuantity}
                      className={`py-4 px-2 text-center whitespace-nowrap ${
                        idx === lastTierIndex
                          ? "text-blue-400 font-bold"
                          : "text-gray-900"
                      }`}
                    >
                      <div className='text-sm font-semibold'>
                        {tier.unitPrice.toLocaleString()}
                      </div>
                      {discountRate > 0 && (
                        <div className='text-xs text-gray-500 mt-0.5'>
                          -{discountRate}%
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
