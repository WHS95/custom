"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ReviewStatusFilterProps {
  statusFilter: string;
  onFilterChange: (status: string) => void;
  reviewCount: number;
}

export default function ReviewStatusFilter({
  statusFilter,
  onFilterChange,
  reviewCount,
}: ReviewStatusFilterProps) {
  return (
    <Card className='mb-6'>
      <CardContent className='py-4'>
        <div className='flex items-center gap-4'>
          <Label>상태 필터</Label>
          <Select value={statusFilter} onValueChange={onFilterChange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='전체' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>전체</SelectItem>
              <SelectItem value='pending'>승인 대기</SelectItem>
              <SelectItem value='approved'>승인됨</SelectItem>
              <SelectItem value='rejected'>거절됨</SelectItem>
            </SelectContent>
          </Select>
          <span className='text-sm text-gray-500'>총 {reviewCount}개</span>
        </div>
      </CardContent>
    </Card>
  );
}
