"use client";

import { useRef, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCenter, updateCenter } from "@/app/(dashboard)/centers/actions";

const COLOR_PRESETS = [
  // Row 1: 빨강 → 보라 (따뜻한 톤)
  "#EF4444", // red
  "#F97316", // orange
  "#F4B860", // amber
  "#EAB308", // yellow
  "#84CC16", // lime
  "#22C55E", // green

  // Row 2: 민트 → 파랑 (차가운 톤)
  "#6ECFBD", // mint
  "#14B8A6", // teal
  "#06B6D4", // cyan
  "#7CB9E8", // sky
  "#3B82F6", // blue
  "#6366F1", // indigo

  // Row 3: 보라 → 핑크 (부드러운 톤)
  "#8B5CF6", // violet
  "#A78BFA", // purple
  "#D946EF", // fuchsia
  "#EC4899", // pink
  "#F5A6C8", // rose
  "#FB923C", // light orange

  // Row 4: 뉴트럴 + 어스 톤
  "#6EE7B7", // emerald
  "#A3E635", // chartreuse
  "#FBBF24", // gold
  "#F87171", // coral
  "#A78B7B", // brown
  "#94A3B8", // slate
];

function ColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const isCustom = !COLOR_PRESETS.includes(color);

  return (
    <div className="space-y-2">
      <Label>센터 색상</Label>
      <div className="grid grid-cols-7 gap-2">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="h-10 w-10 sm:h-8 sm:w-8 rounded-full transition-all"
            style={{
              backgroundColor: c,
              outlineStyle: color === c ? "solid" : "none",
              outlineWidth: color === c ? "3px" : "0",
              outlineColor: c,
              outlineOffset: "2px",
            }}
          />
        ))}
        {/* 커스텀 컬러 피커 버튼 */}
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="relative h-10 w-10 sm:h-8 sm:w-8 rounded-full border-2 border-dashed border-muted-foreground/40 transition-all flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: isCustom ? color : undefined,
            outlineStyle: isCustom ? "solid" : "none",
            outlineWidth: isCustom ? "3px" : "0",
            outlineColor: isCustom ? color : undefined,
            outlineOffset: "2px",
          }}
        >
          {!isCustom && (
            <Palette className="h-4 w-4 text-muted-foreground" />
          )}
          <input
            ref={pickerRef}
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            tabIndex={-1}
          />
        </button>
      </div>
    </div>
  );
}

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
      <ColorPicker color={color} onChange={setColor} />
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
