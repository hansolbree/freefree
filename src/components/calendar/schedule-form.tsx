"use client";

import { useState } from "react";
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
  createSchedule,
  updateSchedule,
} from "@/app/(dashboard)/dashboard/actions";

interface UserCenter {
  center_id: string;
  color: string;
  centers: { id: string; name: string } | null;
}

interface Schedule {
  id: string;
  center_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
}

interface ScheduleFormProps {
  userCenters: UserCenter[];
  schedule?: Schedule;
  defaultDate?: string;
  onSuccess?: () => void;
}

export function ScheduleForm({
  userCenters,
  schedule,
  defaultDate,
  onSuccess,
}: ScheduleFormProps) {
  const [centerId, setCenterId] = useState(schedule?.center_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("center_id", centerId);

    const result = schedule
      ? await updateSchedule(schedule.id, formData)
      : await createSchedule(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess?.();
    }
  }

  if (userCenters.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        먼저 센터를 등록해주세요.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>센터 *</Label>
        <Select value={centerId} onValueChange={(v) => setCenterId(v ?? "")}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="센터를 선택하세요" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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

      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={schedule?.title ?? ""}
          placeholder="스케줄 제목"
          className="rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">날짜 *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={schedule?.date ?? defaultDate ?? ""}
          className="rounded-xl"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="start_time">시작 *</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={schedule?.start_time ?? "09:00"}
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
            defaultValue={schedule?.end_time ?? "18:00"}
            className="rounded-xl"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={schedule?.notes ?? ""}
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
          ? schedule
            ? "수정 중..."
            : "추가 중..."
          : schedule
            ? "스케줄 수정"
            : "스케줄 추가"}
      </Button>
    </form>
  );
}
