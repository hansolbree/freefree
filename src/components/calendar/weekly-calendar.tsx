"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  getWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScheduleForm } from "./schedule-form";
import {
  getSessions,
  getUserCenters,
  deleteCalendarSession,
} from "@/app/(dashboard)/dashboard/actions";

interface UserCenter {
  center_id: string;
  color: string;
  is_active: boolean;
  centers: { id: string; name: string } | null;
}

interface CalendarSession {
  id: string;
  center_id: string;
  client_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  session_number: number;
  session_type: string | null;
  notes: string | null;
  clients: { name: string } | null;
  centers: { name: string } | null;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9~19
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// 미니 캘린더에서 사용할 요일 헤더
const MINI_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WeeklyCalendarProps {
  initialDate: string;
  initialSessions: CalendarSession[];
  initialUserCenters: UserCenter[];
}

export function WeeklyCalendar({
  initialDate,
  initialSessions,
  initialUserCenters,
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date(initialDate));
  const [miniCalMonth, setMiniCalMonth] = useState(() => new Date(initialDate));
  const [sessions, setSessions] = useState<CalendarSession[]>(initialSessions);
  const [userCenters, setUserCenters] =
    useState<UserCenter[]>(initialUserCenters);
  const [visibleCenters, setVisibleCenters] = useState<Set<string>>(
    () => new Set(initialUserCenters.map((c) => c.center_id))
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editSession, setEditSession] = useState<CalendarSession | null>(null);
  const isFirstLoadRef = useRef(true);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

  // 미니 캘린더 날짜 생성
  function getMiniCalDays() {
    const monthStart = startOfMonth(miniCalMonth);
    const monthEnd = endOfMonth(miniCalMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const days: Date[] = [];
    let day = calStart;
    // 6주 표시
    for (let i = 0; i < 42; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }

  // 센터별 총 시간 계산
  function getCenterTotalHours(centerId: string) {
    const centerSessions = sessions.filter(
      (s) => s.center_id === centerId && s.start_time && s.end_time
    );
    let totalMinutes = 0;
    for (const s of centerSessions) {
      if (s.start_time && s.end_time) {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        totalMinutes += eh * 60 + em - (sh * 60 + sm);
      }
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h${mins > 0 ? String(mins).padStart(2, "0") : "00"}`;
  }

  // 해당 날짜에 세션이 있는지 (미니 캘린더 점 표시)
  function hasSessionOnDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return sessions.some((s) => s.session_date === dateStr);
  }

  const loadData = useCallback(async () => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }
    const start = format(weekStart, "yyyy-MM-dd");
    const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const [s, uc] = await Promise.all([
      getSessions(start, end),
      getUserCenters(),
    ]);
    setSessions(s as CalendarSession[]);
    setUserCenters(uc as UserCenter[]);
    if (visibleCenters.size === 0 && uc.length > 0) {
      setVisibleCenters(new Set(uc.map((c: UserCenter) => c.center_id)));
    }
  }, [weekStart.toISOString()]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getColorForCenter(centerId: string) {
    return (
      userCenters.find((uc) => uc.center_id === centerId)?.color ?? "#6ECFBD"
    );
  }

  function toggleCenter(centerId: string) {
    setVisibleCenters((prev) => {
      const next = new Set(prev);
      if (next.has(centerId)) next.delete(centerId);
      else next.add(centerId);
      return next;
    });
  }

  function handleCellClick(day: Date) {
    setSelectedDate(format(day, "yyyy-MM-dd"));
    setEditSession(null);
    setDialogOpen(true);
  }

  function handleSessionClick(session: CalendarSession) {
    setEditSession(session);
    setSelectedDate(session.session_date);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 예약을 삭제하시겠습니까?")) return;
    await deleteCalendarSession(id);
    loadData();
  }

  function handleMiniCalClick(day: Date) {
    setCurrentDate(day);
    setMiniCalMonth(day);
  }

  function getSessionStyle(session: CalendarSession) {
    if (!session.start_time || !session.end_time) {
      return { top: "0rem", height: "3rem" };
    }
    const [sh, sm] = session.start_time.split(":").map(Number);
    const [eh, em] = session.end_time.split(":").map(Number);
    const startMin = (sh - 9) * 60 + sm;
    const duration = eh * 60 + em - (sh * 60 + sm);
    return {
      top: `${(startMin / 60) * 5}rem`,
      height: `${Math.max((duration / 60) * 5, 2.5)}rem`,
    };
  }

  const filteredSessions = sessions.filter((s) =>
    visibleCenters.has(s.center_id)
  );

  const miniCalDays = getMiniCalDays();

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="hidden lg:block w-[260px] shrink-0 space-y-6">
        {/* Mini Calendar */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {format(miniCalMonth, "MMMM yyyy", { locale: ko })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMiniCalMonth(subMonths(miniCalMonth, 1))}
                className="p-1 rounded-lg hover:bg-muted/50 text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMiniCalMonth(addMonths(miniCalMonth, 1))}
                className="p-1 rounded-lg hover:bg-muted/50 text-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-1">
            {MINI_DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {miniCalDays.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, miniCalMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, currentDate);
              const hasSession = hasSessionOnDate(day);

              return (
                <button
                  key={i}
                  onClick={() => handleMiniCalClick(day)}
                  className={`relative h-8 w-full text-xs font-medium rounded-lg transition-all
                    ${!isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                    ${isToday && !isSelected ? "text-primary font-bold" : ""}
                    ${isSelected ? "bg-primary text-white" : "hover:bg-muted/50"}
                  `}
                >
                  {format(day, "d")}
                  {hasSession && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories (Center Filter) */}
        {userCenters.length > 0 && (
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">센터</h3>
            <div className="space-y-3">
              {userCenters.map((uc) => {
                const isVisible = visibleCenters.has(uc.center_id);
                return (
                  <button
                    key={uc.center_id}
                    onClick={() => toggleCenter(uc.center_id)}
                    className="flex items-center justify-between w-full group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-5 w-5 rounded-md flex items-center justify-center transition-opacity"
                        style={{
                          backgroundColor: uc.color,
                          opacity: isVisible ? 1 : 0.3,
                        }}
                      >
                        {isVisible && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-sm transition-opacity ${isVisible ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {uc.centers?.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getCenterTotalHours(uc.center_id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Calendar */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {format(weekStart, "M월 d일", { locale: ko })} -{" "}
              {format(addDays(weekStart, 6), "d일", { locale: ko })},{" "}
              {format(weekStart, "yyyy")}
            </h1>
            <span className="text-xs font-medium text-muted-foreground bg-muted/60 rounded-md px-2 py-1">
              {weekNumber}주차
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setCurrentDate(new Date())}
            >
              오늘
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 gap-1.5"
              onClick={() => {
                setSelectedDate(format(new Date(), "yyyy-MM-dd"));
                setEditSession(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              예약
            </Button>
          </div>
        </div>

        {/* Mobile Center Filter */}
        {userCenters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
            {userCenters.map((uc) => (
              <button
                key={uc.center_id}
                onClick={() => toggleCenter(uc.center_id)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all border"
                style={{
                  backgroundColor: visibleCenters.has(uc.center_id)
                    ? uc.color + "20"
                    : "transparent",
                  borderColor: uc.color,
                  opacity: visibleCenters.has(uc.center_id) ? 1 : 0.4,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: uc.color }}
                />
                {uc.centers?.name}
              </button>
            ))}
          </div>
        )}

        {/* Calendar Grid */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border/20">
            <div />
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`py-4 text-center border-l border-border/10 ${isToday ? "bg-primary/5" : ""}`}
                >
                  <p
                    className={`text-[11px] font-semibold tracking-wider ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`text-lg font-bold mt-0.5 ${
                      isToday
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] relative">
            {/* Hour Labels */}
            <div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[5rem] flex items-start justify-end pr-3 -mt-2"
                >
                  <span className="text-[11px] text-muted-foreground/70 font-medium">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const isToday = isSameDay(day, new Date());
              const daySessions = filteredSessions.filter(
                (s) => s.session_date === dayStr
              );
              return (
                <div
                  key={day.toISOString()}
                  className={`relative border-l border-border/10 cursor-pointer ${isToday ? "bg-primary/[0.02]" : ""}`}
                  onClick={() => handleCellClick(day)}
                >
                  {/* Hour Lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-[5rem] border-b border-border/[0.06]"
                    />
                  ))}

                  {/* Session Blocks */}
                  {daySessions.map((session) => {
                    const color = getColorForCenter(session.center_id);
                    const style = getSessionStyle(session);
                    const clientName = session.clients?.name ?? "내담자";
                    return (
                      <div
                        key={session.id}
                        className="absolute left-1 right-1 rounded-lg px-2.5 py-2 overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group"
                        style={{
                          ...style,
                          backgroundColor: color + "20",
                          borderLeft: `3px solid ${color}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionClick(session);
                        }}
                      >
                        <p className="text-xs font-bold leading-snug text-foreground">
                          {clientName}
                        </p>
                        <p className="text-[11px] text-foreground/60 mt-0.5 truncate">
                          {session.session_number}회기{session.session_type ? ` · ${session.session_type}` : ""}
                        </p>
                        {session.start_time && (
                          <p className="text-[11px] font-semibold mt-0.5 text-foreground/70">
                            {session.start_time.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {editSession ? "예약 수정" : "예약 추가"}
            </DialogTitle>
          </DialogHeader>
          <ScheduleForm
            key={editSession?.id ?? selectedDate}
            userCenters={userCenters}
            session={editSession ?? undefined}
            defaultDate={selectedDate}
            onSuccess={() => {
              setDialogOpen(false);
              setEditSession(null);
              loadData();
            }}
          />
          {editSession && (
            <Button
              variant="ghost"
              className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                handleDelete(editSession.id);
                setDialogOpen(false);
                setEditSession(null);
              }}
            >
              예약 삭제
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
