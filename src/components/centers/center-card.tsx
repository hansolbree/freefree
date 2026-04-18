"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, MapPin, Phone, Pencil, Trash2 } from "lucide-react";
import { deleteCenter } from "@/app/(dashboard)/centers/actions";
import { CenterForm } from "./center-form";

interface CenterCardProps {
  center: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    notes: string | null;
    user_centers: { color: string }[];
  };
}

export function CenterCard({ center }: CenterCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const color = center.user_centers?.[0]?.color ?? "#6ECFBD";

  async function handleDelete() {
    if (!confirm("이 센터를 삭제하시겠습니까?")) return;
    setDeleting(true);
    await deleteCenter(center.id);
    setDeleting(false);
  }

  return (
    <Card className="rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
      <CardContent className="p-6">
        {/* Color indicator + name */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: color + "20" }}
            >
              <Building2 className="h-5 w-5" style={{ color }} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {center.name}
            </h3>
          </div>
          <div className="flex gap-1">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <Pencil className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>센터 수정</DialogTitle>
                </DialogHeader>
                <CenterForm
                  center={center}
                  onSuccess={() => setEditOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {center.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{center.address}</span>
            </div>
          )}
          {center.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              <span>{center.phone}</span>
            </div>
          )}
          {center.notes && (
            <p className="mt-2 text-xs text-muted-foreground/70 line-clamp-2">
              {center.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
