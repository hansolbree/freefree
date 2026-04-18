"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CenterCard } from "@/components/centers/center-card";
import { CenterForm } from "@/components/centers/center-form";

interface Center {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  user_centers: { color: string }[];
}

export function CenterPageClient({ centers }: { centers: Center[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">상담센터</h1>
          <p className="text-sm text-muted-foreground mt-1">
            출근하는 상담센터를 관리하세요
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity gap-2" />
            }
          >
            <Plus className="h-4 w-4" />
            센터 추가
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>새 센터 추가</DialogTitle>
            </DialogHeader>
            <CenterForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {centers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-3xl bg-white/70 backdrop-blur-sm p-6 shadow-md">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            등록된 센터가 없습니다
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            상단의 &quot;센터 추가&quot; 버튼으로 첫 센터를 등록하세요
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((center) => (
            <CenterCard key={center.id} center={center} />
          ))}
        </div>
      )}
    </div>
  );
}
