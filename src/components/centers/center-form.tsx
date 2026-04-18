"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCenter, updateCenter } from "@/app/(dashboard)/centers/actions";

const COLOR_PRESETS = [
  "#6ECFBD", // mint
  "#F5A6C8", // pink
  "#7CB9E8", // blue
  "#F4B860", // orange
  "#A78BFA", // purple
  "#6EE7B7", // green
];

interface CenterFormProps {
  center?: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    notes: string | null;
    user_centers: { color: string }[];
  };
  onSuccess?: () => void;
}

export function CenterForm({ center, onSuccess }: CenterFormProps) {
  const [color, setColor] = useState(
    center?.user_centers?.[0]?.color ?? COLOR_PRESETS[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("color", color);

    const result = center
      ? await updateCenter(center.id, formData)
      : await createCenter(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess?.();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">센터 이름 *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={center?.name ?? ""}
          placeholder="상담센터 이름"
          className="rounded-xl"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">주소</Label>
        <Input
          id="address"
          name="address"
          defaultValue={center?.address ?? ""}
          placeholder="센터 주소"
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">전화번호</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={center?.phone ?? ""}
          placeholder="02-1234-5678"
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={center?.notes ?? ""}
          placeholder="센터에 대한 메모"
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>센터 색상</Label>
        <div className="flex gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-8 w-8 rounded-full transition-all"
              style={{
                backgroundColor: c,
                outline: color === c ? "3px solid" : "none",
                outlineColor: c,
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity"
      >
        {loading
          ? center
            ? "수정 중..."
            : "생성 중..."
          : center
            ? "센터 수정"
            : "센터 추가"}
      </Button>
    </form>
  );
}
