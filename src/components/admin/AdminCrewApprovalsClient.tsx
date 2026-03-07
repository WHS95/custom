"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface PendingItem {
  id: string;
  userId: string;
  name: string;
  crewName: string;
  email: string;
  createdAt: string;
}

interface CompletedItem {
  id: string;
  userId: string;
  name: string;
  crewName: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminCrewApprovalsClientProps {
  tenantSlug: string;
}

export function AdminCrewApprovalsClient({
  tenantSlug,
}: AdminCrewApprovalsClientProps) {
  const router = useRouter();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crew-approvals?status=pending");
      const data = await res.json();
      setPendingItems(data.items || []);
    } catch {
      toast.error("대기 목록 조회 실패");
    }
  }, []);

  const fetchCompleted = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crew-approvals?status=completed");
      const data = await res.json();
      setCompletedItems(data.items || []);
    } catch {
      toast.error("처리 완료 목록 조회 실패");
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPending(), fetchCompleted()]);
    setIsLoading(false);
  }, [fetchPending, fetchCompleted]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setProcessingId(userId);
    try {
      const res = await fetch("/api/admin/crew-approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "처리 실패");
        return;
      }

      toast.success(action === "approve" ? "승인 완료" : "거절 완료");
      await loadData();
    } catch {
      toast.error("처리 중 오류 발생");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${tenantSlug}/dashboard`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">크루 멤버 승인</h1>
              <p className="text-sm text-gray-500">
                크루 멤버 인증 요청을 관리합니다
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-1.5">
              대기중
              {pendingItems.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                  {pendingItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">처리완료</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : pendingItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  대기 중인 승인 요청이 없습니다
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{item.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.crewName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {item.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(item.userId, "reject")}
                            disabled={processingId === item.userId}
                          >
                            {processingId === item.userId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                거절
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction(item.userId, "approve")}
                            disabled={processingId === item.userId}
                          >
                            {processingId === item.userId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                승인
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : completedItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  처리된 내역이 없습니다
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.name}</span>
                            {item.crewName && (
                              <Badge variant="outline" className="text-xs">
                                {item.crewName}
                              </Badge>
                            )}
                            <Badge
                              variant={item.userType === "crew_staff" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {item.userType === "crew_staff" ? "승인됨" : "거절됨"}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(item.updatedAt || item.createdAt)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
