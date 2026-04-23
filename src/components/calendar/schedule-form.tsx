"use client";

import { useState, useEffect } from "react";
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
  createCalendarSession,
  updateCalendarSession,
  getClientsByCenter,
} from "@/app/(dashboard)/dashboard/actions";

interface UserCenter {
  center_id: string;
  color: string;
  centers: { id: string; name: string } | null;
}

interface Client {
  id: string;
  name: string;
}

interface CalendarSession {
  id: string;
  center_id: string;
  client_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  session_type: string | null;
  session_number: number;
  notes: string | null;
  clients: { name: string } | null;
}

interface ScheduleFormProps {
  userCenters: UserCenter[];
  session?: CalendarSession;
  defaultDate?: string;
  onSuccess?: () => void;
}

const SESSION_TYPES = [
  { value: "개인상담", label: "개인상담" },
  { value: "해석상담", label: "해석상담" },
  { value: "집단상담", label: "집단상담" },
  { value: "기타", label: "기타" },
];

export function ScheduleForm({
  userCenters,
  session,
  defaultDate,
  onSuccess,
}: ScheduleFormProps) {
  const [centerId, setCenterId] = useState(session?.center_id ?? "");
  const [clientId, setClientId] = useState(session?.client_id ?? "");
  const [sessionType, setSessionType] = useState(session?.session_type ?? "");
  const [startTime, setStartTime] = useState(
    session?.start_time?.slice(0, 5) ?? "10:00",
  );
  const [endTime, setEndTime] = useState(
    session?.end_time?.slice(0, 5) ?? "11:00",
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsReady, setClientsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addOneHour(time: string): string {
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return time;
    const newH = (h + 1) % 24;
    return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // 센터 변경 시 해당 센터의 내담자 목록 로드
  useEffect(() => {
    if (!centerId) {
      setClients([]);
      setClientsReady(false);
      setClientId(session?.client_id ?? "");
      return;
    }
    setLoadingClients(true);
    setClientsReady(false);
    getClientsByCenter(centerId).then((data) => {
      setClients(data as Client[]);
      setLoadingClients(false);
      setClientsReady(true);
      // 수정 모드가 아니거나 센터가 바뀐 경우 내담자 선택 초기화
      if (!session || centerId !== session.center_id) {
        setClientId("");
      }
    });
  }, [centerId]);

  // 센터 이름 찾기
  function getCenterName(id: string) {
    return userCenters.find((uc) => uc.center_id === id)?.centers?.name ?? "";
  }

  // 내담자 이름 찾기
  function getClientName(id: string) {
    const found = clients.find((c) => c.id === id);
    if (found) return found.name;
    // 아직 로딩 중일 때 session에서 이름 가져오기
    if (session && id === session.client_id && session.clients?.name) {
      return session.clients.name;
    }
    return "";
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("center_id", centerId);
    formData.set("client_id", clientId);
    formData.set("session_type", sessionType);

    const result = session
      ? await updateCalendarSession(session.id, formData)
      : await createCalendarSession(formData);

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

      {/* 센터 선택 */}
      <div className="space-y-2">
        <Label>센터 *</Label>
        <Select value={centerId} onValueChange={(v) => setCenterId(v ?? "")}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="센터를 선택하세요">
              {centerId ? (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        userCenters.find((uc) => uc.center_id === centerId)
                          ?.color ?? "#6ECFBD",
                    }}
                  />
                  {getCenterName(centerId)}
                </span>
              ) : (
                "센터를 선택하세요"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {userCenters.map((uc) => (
              <SelectItem
                key={uc.center_id}
                value={uc.center_id}
              >
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

      {/* 내담자 선택 */}
      <div className="space-y-2">
        <Label>내담자 *</Label>
        <Select
          key={clientsReady ? "ready" : "loading"}
          value={clientId}
          onValueChange={(v) => setClientId(v ?? "")}
          disabled={!centerId || loadingClients}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder={
              !centerId
                ? "센터를 먼저 선택하세요"
                : loadingClients
                  ? "불러오는 중..."
                  : clients.length === 0
                    ? "등록된 내담자가 없습니다"
                    : "내담자를 선택하세요"
            }>
              {clientId ? getClientName(clientId) || "내담자를 선택하세요" : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 날짜 */}
      <div className="space-y-2">
        <Label htmlFor="session_date">날짜 *</Label>
        <Input
          id="session_date"
          name="session_date"
          type="date"
          defaultValue={session?.session_date ?? defaultDate ?? ""}
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
            value={startTime}
            onChange={(e) => {
              const v = e.target.value;
              setStartTime(v);
              if (v) setEndTime(addOneHour(v));
            }}
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
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>
      </div>

      {/* 상담 유형 */}
      <div className="space-y-2">
        <Label>상담 유형</Label>
        <Select value={sessionType} onValueChange={(v) => setSessionType(v ?? "")}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="상담 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {SESSION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 회기번호 */}
      <div className="space-y-2">
        <Label htmlFor="session_number">회기번호</Label>
        <Input
          id="session_number"
          name="session_number"
          type="number"
          min={1}
          defaultValue={session?.session_number ?? ""}
          placeholder="비워두면 자동 계산"
          className="rounded-xl"
        />
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={session?.notes ?? ""}
          placeholder="메모"
          className="rounded-xl resize-none"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !clientId}
        className="w-full rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity"
      >
        {loading
          ? session
            ? "수정 중..."
            : "추가 중..."
          : session
            ? "예약 수정"
            : "예약 추가"}
      </Button>
    </form>
  );
}
