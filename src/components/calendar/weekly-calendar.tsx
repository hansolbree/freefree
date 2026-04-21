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
import { enUS, ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScheduleForm } from "./schedule-form";
import { CalendarSearch } from "./calendar-search";
import { LectureForm, type CalendarLecture } from "../lectures/lecture-form";
import {
  getCalendarData,
  deleteCalendarSession,
  deleteLecture,
  deleteLectureSeries,
  type SearchResult,
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

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 22;
const HOUR_HEIGHT = 7; // rem per hour
const SCROLL_DEFAULT_HOUR = 13; // 초기 스크롤 위치 (오후 시간대 보이도록)
const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => i + DAY_START_HOUR
); // 7~22

function formatAmPm(time: string) {
  const hh = time.slice(0, 2);
  const hour = parseInt(hh, 10);
  return `${hour < 12 ? "AM" : "PM"} ${time.slice(0, 5)}`;
}
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// 미니 캘린더에서 사용할 요일 헤더
const MINI_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WeeklyCalendarProps {
  initialDate: string;
  initialSessions: CalendarSession[];
  initialLectures: CalendarLecture[];
  initialUserCenters: UserCenter[];
}

type DialogMode = "session" | "lecture";

export function WeeklyCalendar({
  initialDate,
  initialSessions,
  initialLectures,
  initialUserCenters,
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date(initialDate));
  const [miniCalMonth, setMiniCalMonth] = useState(() => new Date(initialDate));
  const [sessions, setSessions] = useState<CalendarSession[]>(initialSessions);
  const [lectures, setLectures] = useState<CalendarLecture[]>(initialLectures);
  const [userCenters, setUserCenters] =
    useState<UserCenter[]>(initialUserCenters);
  const [visibleCenters, setVisibleCenters] = useState<Set<string>>(
    () => new Set(initialUserCenters.map((c) => c.center_id))
  );
  const [showLectures, setShowLectures] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("session");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editSession, setEditSession] = useState<CalendarSession | null>(null);
  const [editLecture, setEditLecture] = useState<CalendarLecture | null>(null);
  const isFirstLoadRef = useRef(true);
  const desktopGridRef = useRef<HTMLDivElement>(null);

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

  // 센터별 총 시간 계산 (세션 + 해당 센터 강의)
  function getCenterTotalHours(centerId: string) {
    let totalMinutes = 0;
    for (const s of sessions) {
      if (s.center_id === centerId && s.start_time && s.end_time) {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        totalMinutes += eh * 60 + em - (sh * 60 + sm);
      }
    }
    for (const l of lectures) {
      if (l.center_id === centerId) {
        const [sh, sm] = l.start_time.split(":").map(Number);
        const [eh, em] = l.end_time.split(":").map(Number);
        totalMinutes += eh * 60 + em - (sh * 60 + sm);
      }
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h${mins > 0 ? String(mins).padStart(2, "0") : "00"}`;
  }

  // 해당 날짜에 이벤트가 있는지 (미니 캘린더 점 표시)
  function hasSessionOnDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return (
      sessions.some((s) => s.session_date === dateStr) ||
      lectures.some((l) => l.lecture_date === dateStr)
    );
  }

  const loadData = useCallback(async () => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }
    const start = format(weekStart, "yyyy-MM-dd");
    const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const { sessions: s, lectures: l, userCenters: uc } =
      await getCalendarData(start, end);
    setSessions(s as CalendarSession[]);
    setLectures(l as CalendarLecture[]);
    setUserCenters(uc as UserCenter[]);
    if (visibleCenters.size === 0 && uc.length > 0) {
      setVisibleCenters(new Set(uc.map((c: UserCenter) => c.center_id)));
    }
  }, [weekStart.toISOString()]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const el = desktopGridRef.current;
    if (!el) return;
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize || "16"
    );
    el.scrollTop =
      (SCROLL_DEFAULT_HOUR - DAY_START_HOUR) * HOUR_HEIGHT * rootFontSize;
  }, []);

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

  function openCreate(day: Date, mode: DialogMode) {
    setSelectedDate(format(day, "yyyy-MM-dd"));
    setEditSession(null);
    setEditLecture(null);
    setDialogMode(mode);
    setDialogOpen(true);
  }

  function handleCellClick(day: Date) {
    openCreate(day, "session");
  }

  function handleSessionClick(session: CalendarSession) {
    setEditSession(session);
    setEditLecture(null);
    setSelectedDate(session.session_date);
    setDialogMode("session");
    setDialogOpen(true);
  }

  function handleLectureClick(lecture: CalendarLecture) {
    setEditLecture(lecture);
    setEditSession(null);
    setSelectedDate(lecture.lecture_date);
    setDialogMode("lecture");
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 예약을 삭제하시겠습니까?")) return;
    await deleteCalendarSession(id);
    loadData();
  }

  async function handleLectureDelete(lecture: CalendarLecture) {
    if (lecture.series_id) {
      const deleteAll = confirm(
        "반복 강의입니다. 시리즈 전체를 삭제할까요?\n확인: 전체 삭제 / 취소: 이 회차만 삭제"
      );
      if (deleteAll) {
        await deleteLectureSeries(lecture.series_id);
      } else {
        await deleteLecture(lecture.id);
      }
    } else {
      if (!confirm("이 강의를 삭제하시겠습니까?")) return;
      await deleteLecture(lecture.id);
    }
    loadData();
  }

  function handleMiniCalClick(day: Date) {
    setCurrentDate(day);
    setMiniCalMonth(day);
  }

  function handleSearchSelect(result: SearchResult) {
    const target = new Date(result.date + "T00:00:00");
    setCurrentDate(target);
    setMiniCalMonth(target);
  }

  function getSessionStyle(session: CalendarSession) {
    if (!session.start_time || !session.end_time) {
      return { top: "0rem", height: "3rem" };
    }
    const [sh, sm] = session.start_time.split(":").map(Number);
    const [eh, em] = session.end_time.split(":").map(Number);
    const startMin = (sh - DAY_START_HOUR) * 60 + sm;
    const duration = eh * 60 + em - (sh * 60 + sm);
    return {
      top: `${(startMin / 60) * HOUR_HEIGHT}rem`,
      height: `${Math.max((duration / 60) * HOUR_HEIGHT, 3)}rem`,
    };
  }

  function getLectureStyle(lecture: CalendarLecture) {
    const [sh, sm] = lecture.start_time.split(":").map(Number);
    const [eh, em] = lecture.end_time.split(":").map(Number);
    const startMin = (sh - DAY_START_HOUR) * 60 + sm;
    const duration = eh * 60 + em - (sh * 60 + sm);
    return {
      top: `${(startMin / 60) * HOUR_HEIGHT}rem`,
      height: `${Math.max((duration / 60) * HOUR_HEIGHT, 3)}rem`,
    };
  }

  const filteredSessions = sessions.filter((s) =>
    visibleCenters.has(s.center_id)
  );

  const filteredLectures = showLectures
    ? lectures.filter(
        (l) => !l.center_id || visibleCenters.has(l.center_id)
      )
    : [];

  const miniCalDays = getMiniCalDays();

  const currentDayStr = format(currentDate, "yyyy-MM-dd");
  const currentDaySessions = filteredSessions
    .filter((s) => s.session_date === currentDayStr)
    .sort((a, b) =>
      (a.start_time ?? "").localeCompare(b.start_time ?? "")
    );
  const currentDayLectures = filteredLectures
    .filter((l) => l.lecture_date === currentDayStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <>
      {/* Mobile Day Agenda — < md */}
      <div className="md:hidden">
        {/* Search */}
        <div className="mb-4">
          <CalendarSearch onSelect={handleSearchSelect} />
        </div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-1.5 tracking-wide">
            <span className="text-base font-bold text-foreground tabular-nums">
              {format(currentDate, "yyyy.MMM.dd", { locale: enUS }).toUpperCase()}
            </span>
            <span className="text-base font-bold text-primary">
              {format(currentDate, "EEE", { locale: enUS }).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
              aria-label="이전 주"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
              aria-label="다음 주"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Week Day Strip */}
        <div className="grid grid-cols-7 gap-1 mb-5">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayStr = format(day, "yyyy-MM-dd");
            const daySessionCount = sessions.filter(
              (s) => s.session_date === dayStr
            ).length;
            return (
              <button
                key={day.toISOString()}
                onClick={() => setCurrentDate(day)}
                className="flex flex-col items-center gap-1 py-1"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all tabular-nums ${
                    isSelected
                      ? "bg-primary text-white shadow-sm"
                      : isToday
                        ? "text-primary"
                        : "text-foreground"
                  }`}
                >
                  {format(day, "dd")}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-wider ${
                    isSelected
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "EEE", { locale: enUS }).toUpperCase()}
                </span>
                <span
                  className={`h-1 w-1 rounded-full mt-0.5 ${
                    daySessionCount > 0
                      ? isSelected
                        ? "bg-primary"
                        : "bg-primary/60"
                      : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Center Filter Pills */}
        {(userCenters.length > 0 || lectures.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {userCenters.map((uc) => (
              <button
                key={uc.center_id}
                onClick={() => toggleCenter(uc.center_id)}
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all border"
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
            {lectures.length > 0 && (
              <button
                onClick={() => setShowLectures((v) => !v)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all border border-foreground/40"
                style={{
                  backgroundColor: showLectures ? "rgba(0,0,0,0.06)" : "transparent",
                  opacity: showLectures ? 1 : 0.4,
                }}
              >
                <BookOpen className="h-3 w-3" />
                강의
              </button>
            )}
          </div>
        )}

        {/* Timeline — internally scrollable */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
          <div
            className="overflow-y-auto overscroll-contain pt-4"
            style={{ maxHeight: "calc(100vh - 18rem)" }}
          >
            <div className="grid grid-cols-[3rem_1fr]">
              {/* Hour Labels Column */}
              <div>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-[7rem] flex items-start justify-end pr-2 -mt-2"
                  >
                    <span className="text-sm text-muted-foreground/70 font-medium tabular-nums">
                      {String(hour).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Column */}
              <div className="relative border-l border-border/[0.06]">
                {HOURS.map((hour, i) => (
                  <div
                    key={hour}
                    className={`h-[7rem] ${i < HOURS.length - 1 ? "border-b border-border/[0.06]" : ""}`}
                  />
                ))}

                {/* Session Blocks */}
                {currentDaySessions.map((session) => {
                  const color = getColorForCenter(session.center_id);
                  const style = getSessionStyle(session);
                  const clientName = session.clients?.name ?? "내담자";
                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSessionClick(session)}
                      className="absolute left-2 right-3 rounded-lg px-3 py-2 text-left transition-all hover:shadow-md active:scale-[0.99] overflow-hidden"
                      style={{
                        ...style,
                        backgroundColor: color + "20",
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <p className="text-sm font-bold text-foreground truncate leading-tight">
                        {clientName}
                      </p>
                      {session.start_time && session.end_time && (
                        <p className="text-xs text-foreground/60 mt-0.5 tabular-nums">
                          {formatAmPm(session.start_time)} –{" "}
                          {formatAmPm(session.end_time)}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[11px] text-muted-foreground truncate">
                          {session.centers?.name}
                          {session.session_type
                            ? ` · ${session.session_type}`
                            : ""}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Lecture Blocks */}
                {currentDayLectures.map((lecture) => {
                  const style = getLectureStyle(lecture);
                  const venue =
                    lecture.centers?.name ?? lecture.location ?? "외부 강의";
                  return (
                    <button
                      key={lecture.id}
                      onClick={() => handleLectureClick(lecture)}
                      className="absolute left-2 right-3 rounded-lg px-3 py-2 text-left transition-all hover:shadow-md active:scale-[0.99] overflow-hidden"
                      style={{
                        ...style,
                        backgroundColor: lecture.color + "20",
                        borderLeft: `3px solid ${lecture.color}`,
                      }}
                    >
                      <p className="text-sm font-bold text-foreground truncate leading-tight flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: lecture.color }} />
                        {lecture.title}
                      </p>
                      <p className="text-xs text-foreground/60 mt-0.5 tabular-nums">
                        {formatAmPm(lecture.start_time)} – {formatAmPm(lecture.end_time)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-muted-foreground truncate">
                          {venue}
                          {lecture.audience ? ` · ${lecture.audience}` : ""}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95 flex items-center justify-center z-40 transition-all"
            aria-label="추가"
          >
            <Plus className="h-6 w-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => openCreate(currentDate, "session")}>
              세션 예약
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreate(currentDate, "lecture")}>
              <BookOpen className="h-4 w-4 mr-2" />
              강의
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Week View — md+ */}
      <div className="hidden md:flex gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block w-[260px] shrink-0 space-y-6">
        {/* Mini Calendar */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">
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
            <h3 className="text-base font-bold text-foreground mb-4">센터</h3>
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
              <button
                onClick={() => setShowLectures((v) => !v)}
                className="flex items-center justify-between w-full group pt-3 border-t border-border/40"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-5 w-5 rounded-md flex items-center justify-center transition-opacity bg-foreground"
                    style={{ opacity: showLectures ? 1 : 0.3 }}
                  >
                    {showLectures && (
                      <BookOpen className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm transition-opacity ${showLectures ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    강의
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {lectures.length}건
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Calendar */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="mb-4 max-w-xl">
          <CalendarSearch onSelect={handleSearchSelect} />
        </div>
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
            <h1 className="text-2xl font-bold text-foreground">
              {format(weekStart, "M월 d일", { locale: ko })} -{" "}
              {format(addDays(weekStart, 6), "d일", { locale: ko })},{" "}
              {format(weekStart, "yyyy")}
            </h1>
            <span className="text-sm font-medium text-muted-foreground bg-muted/60 rounded-md px-2 py-1">
              {weekNumber}주차
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl text-sm"
              onClick={() => setCurrentDate(new Date())}
            >
              오늘
            </Button>
            <Button
              className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 gap-1.5"
              onClick={() => openCreate(new Date(), "session")}
            >
              <Plus className="h-4 w-4" />
              예약
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl font-semibold text-sm gap-1.5"
              onClick={() => openCreate(new Date(), "lecture")}
            >
              <BookOpen className="h-4 w-4" />
              강의
            </Button>
          </div>
        </div>

        {/* Mobile Center Filter */}
        {(userCenters.length > 0 || lectures.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
            {userCenters.map((uc) => (
              <button
                key={uc.center_id}
                onClick={() => toggleCenter(uc.center_id)}
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all border"
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
            {lectures.length > 0 && (
              <button
                onClick={() => setShowLectures((v) => !v)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all border border-foreground/40"
                style={{
                  backgroundColor: showLectures ? "rgba(0,0,0,0.06)" : "transparent",
                  opacity: showLectures ? 1 : 0.4,
                }}
              >
                <BookOpen className="h-3 w-3" />
                강의
              </button>
            )}
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
                    className={`text-xs font-semibold tracking-wider ${isToday ? "text-primary" : "text-muted-foreground"}`}
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

          {/* Time Grid — scrollable */}
          <div
            ref={desktopGridRef}
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: "calc(100vh - 18rem)" }}
          >
          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] relative">
            {/* Hour Labels */}
            <div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[7rem] flex items-start justify-end pr-3 -mt-2"
                >
                  <span className="text-sm text-muted-foreground/70 font-medium">
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
              const dayLectures = filteredLectures.filter(
                (l) => l.lecture_date === dayStr
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
                      className="h-[7rem] border-b border-border/[0.06]"
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
                        <p className="text-sm font-bold leading-snug text-foreground">
                          {clientName}
                        </p>
                        <p className="text-xs text-foreground/60 mt-0.5 truncate">
                          {session.session_number}회기{session.session_type ? ` · ${session.session_type}` : ""}
                        </p>
                        {session.start_time && (
                          <p className="text-xs font-semibold mt-0.5 text-foreground/70">
                            {session.start_time.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Lecture Blocks */}
                  {dayLectures.map((lecture) => {
                    const style = getLectureStyle(lecture);
                    return (
                      <div
                        key={lecture.id}
                        className="absolute left-1 right-1 rounded-lg px-2.5 py-2 overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group"
                        style={{
                          ...style,
                          backgroundColor: lecture.color + "20",
                          borderLeft: `3px solid ${lecture.color}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLectureClick(lecture);
                        }}
                      >
                        <p className="text-sm font-bold leading-snug text-foreground flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: lecture.color }} />
                          <span className="truncate">{lecture.title}</span>
                        </p>
                        <p className="text-xs text-foreground/60 mt-0.5 truncate">
                          {lecture.centers?.name ?? lecture.location ?? "외부 강의"}
                        </p>
                        <p className="text-xs font-semibold mt-0.5 text-foreground/70">
                          {lecture.start_time.slice(0, 5)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "lecture"
                ? editLecture
                  ? "강의 수정"
                  : "강의 추가"
                : editSession
                  ? "예약 수정"
                  : "예약 추가"}
            </DialogTitle>
          </DialogHeader>
          {dialogMode === "session" ? (
            <>
              <ScheduleForm
                key={editSession?.id ?? `session-${selectedDate}`}
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
            </>
          ) : (
            <>
              <LectureForm
                key={editLecture?.id ?? `lecture-${selectedDate}`}
                userCenters={userCenters}
                lecture={editLecture ?? undefined}
                defaultDate={selectedDate}
                onSuccess={() => {
                  setDialogOpen(false);
                  setEditLecture(null);
                  loadData();
                }}
              />
              {editLecture && (
                <Button
                  variant="ghost"
                  className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleLectureDelete(editLecture);
                    setDialogOpen(false);
                    setEditLecture(null);
                  }}
                >
                  {editLecture.series_id ? "강의 삭제 (회차/시리즈 선택)" : "강의 삭제"}
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
