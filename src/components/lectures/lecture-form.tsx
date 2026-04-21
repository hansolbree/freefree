"use client";

import { useRef, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLecture,
  updateLecture,
} from "@/app/(dashboard)/dashboard/actions";

const COLOR_PRESETS = [
  "#EF4444", "#F97316", "#F4B860", "#EAB308", "#84CC16", "#22C55E",
  "#6ECFBD", "#14B8A6", "#06B6D4", "#7CB9E8", "#3B82F6", "#6366F1",
  "#8B5CF6", "#A78BFA", "#D946EF", "#EC4899", "#F5A6C8", "#FB923C",
  "#6EE7B7", "#A3E635", "#FBBF24", "#F87171", "#A78B7B", "#94A3B8",
];

const EXTERNAL = "__external__";

interface UserCenter {
  center_id: string;
  color: string;
  centers: { id: string; name: string } | null;
}

export interface CalendarLecture {
  id: string;
  series_id: string | null;
  title: string;
  center_id: string | null;
  location: string | null;
  audience: string | null;
  color: string;
  lecture_date: string;
  start_time: string;
  end_time: string;
  fee: number | null;
  fee_paid: boolean;
  notes: string | null;
  centers?: { name: string } | null;
}

interface LectureFormProps {
  userCenters: UserCenter[];
  lecture?: CalendarLecture;
  defaultDate?: string;
  onSuccess?: () => void;
}

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
      <Label>강의 색상</Label>
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
          {!isCustom && <Palette className="h-4 w-4 text-muted-foreground" />}
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

export function LectureForm({
  userCenters,
  lecture,
  defaultDate,
  onSuccess,
}: LectureFormProps) {
  const [centerSelection, setCenterSelection] = useState<string>(
    lecture ? (lecture.center_id ?? EXTERNAL) : EXTERNAL
  );
  const [color, setColor] = useState(lecture?.color ?? COLOR_PRESETS[6]);
  const [feePaid, setFeePaid] = useState(lecture?.fee_paid ?? false);
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isExternal = centerSelection === EXTERNAL;
  const isEdit = !!lecture;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("color", color);
    formData.set("center_id", isExternal ? "" : centerSelection);
    if (!isEdit) {
      formData.set("recurrence", recurrence);
      formData.set("recurrence_count", String(recurrenceCount));
    }

    const result = isEdit
      ? await updateLecture(lecture!.id, formData)
      : await createLecture(formData);

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

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">강의 제목/주제 *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={lecture?.title ?? ""}
          placeholder="예: 신입사원 스트레스 관리 워크샵"
          className="rounded-xl"
          required
        />
      </div>

      {/* 센터 선택 */}
      <div className="space-y-2">
        <Label>센터</Label>
        <Select value={centerSelection} onValueChange={(v) => setCenterSelection(v ?? EXTERNAL)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue>
              {isExternal ? (
                <span className="text-muted-foreground">외부 강의 (센터 없음)</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        userCenters.find((uc) => uc.center_id === centerSelection)
                          ?.color ?? "#6ECFBD",
                    }}
                  />
                  {userCenters.find((uc) => uc.center_id === centerSelection)?.centers?.name}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value={EXTERNAL}>외부 강의 (센터 없음)</SelectItem>
            {userCenters.map((uc) => (
              <SelectItem key={uc.center_id} value={uc.center_id}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: uc.color }}
                  />
                  {uc.centers?.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 외부 장소 */}
      {isExternal && (
        <div className="space-y-2">
          <Label htmlFor="location">장소</Label>
          <Input
            id="location"
            name="location"
            defaultValue={lecture?.location ?? ""}
            placeholder="예: OO대학교, OO기업 본사"
            className="rounded-xl"
          />
        </div>
      )}

      {/* 대상 */}
      <div className="space-y-2">
        <Label htmlFor="audience">대상</Label>
        <Input
          id="audience"
          name="audience"
          defaultValue={lecture?.audience ?? ""}
          placeholder="예: 신입사원 20명, 대학생"
          className="rounded-xl"
        />
      </div>

      {/* 날짜 */}
      <div className="space-y-2">
        <Label htmlFor="lecture_date">날짜 *</Label>
        <Input
          id="lecture_date"
          name="lecture_date"
          type="date"
          defaultValue={lecture?.lecture_date ?? defaultDate ?? ""}
          className="rounded-xl"
          required
        />
      </div>

      {/* 시간 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="start_time">시작 *</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={lecture?.start_time?.slice(0, 5) ?? "14:00"}
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">종료 *</Label>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            defaultValue={lecture?.end_time?.slice(0, 5) ?? "16:00"}
            className="rounded-xl"
            required
          />
        </div>
      </div>

      {/* 페이 */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div className="space-y-2">
          <Label htmlFor="fee">페이 (원)</Label>
          <Input
            id="fee"
            name="fee"
            type="number"
            min={0}
            step={10000}
            defaultValue={lecture?.fee ?? ""}
            placeholder="예: 300000"
            className="rounded-xl"
          />
        </div>
        <label
          className="flex items-center gap-2 rounded-xl border px-3 h-10 cursor-pointer select-none"
          style={{
            backgroundColor: feePaid ? "#22C55E20" : undefined,
            borderColor: feePaid ? "#22C55E" : undefined,
          }}
        >
          <input
            type="checkbox"
            name="fee_paid"
            checked={feePaid}
            onChange={(e) => setFeePaid(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium">수령</span>
        </label>
      </div>

      {/* 반복 (생성 시만) */}
      {!isEdit && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>반복</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v ?? "none")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">없음</SelectItem>
                <SelectItem value="weekly">매주</SelectItem>
                <SelectItem value="biweekly">격주</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recurrence_count">횟수 (최대 12)</Label>
            <Input
              id="recurrence_count"
              type="number"
              min={1}
              max={12}
              value={recurrenceCount}
              onChange={(e) => setRecurrenceCount(parseInt(e.target.value, 10) || 1)}
              disabled={recurrence === "none"}
              className="rounded-xl"
            />
          </div>
        </div>
      )}

      {/* 색상 */}
      <ColorPicker color={color} onChange={setColor} />

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={lecture?.notes ?? ""}
          placeholder="메모"
          className="rounded-xl resize-none"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity"
      >
        {loading
          ? isEdit
            ? "수정 중..."
            : "추가 중..."
          : isEdit
            ? "강의 수정"
            : recurrence !== "none"
              ? `강의 ${recurrenceCount}회 추가`
              : "강의 추가"}
      </Button>
    </form>
  );
}
