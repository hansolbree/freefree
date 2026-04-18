"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
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
  getSchedules,
  getUserCenters,
  deleteSchedule,
} from "@/app/(dashboard)/dashboard/actions";

interface UserCenter {
  center_id: string;
  color: string;
  is_active: boolean;
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
  centers: { name: string } | null;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7~19

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userCenters, setUserCenters] = useState<UserCenter[]>([]);
  const [visibleCenters, setVisibleCenters] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadData = useCallback(async () => {
    const start = format(weekStart, "yyyy-MM-dd");
    const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const [s, uc] = await Promise.all([
      getSchedules(start, end),
      getUserCenters(),
    ]);
    setSchedules(s as Schedule[]);
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
    setEditSchedule(null);
    setDialogOpen(true);
  }

  function handleScheduleClick(schedule: Schedule) {
    setEditSchedule(schedule);
    setSelectedDate(schedule.date);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 스케줄을 삭제하시겠습니까?")) return;
    await deleteSchedule(id);
    loadData();
  }

  function getScheduleStyle(schedule: Schedule) {
    const [sh, sm] = schedule.start_time.split(":").map(Number);
    const [eh, em] = schedule.end_time.split(":").map(Number);
    const startMin = (sh - 7) * 60 + sm;
    const duration = (eh - 7) * 60 + em - startMin;
    return {
      top: `${(startMin / 60) * 4}rem`,
      height: `${Math.max((duration / 60) * 4, 1.5)}rem`,
    };
  }

  const filteredSchedules = schedules.filter((s) =>
    visibleCenters.has(s.center_id)
  );

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">캘린더</h1>
          <p className="text-sm text-muted-foreground mt-1">
            주간 일정을 한눈에 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium min-w-[160px] text-center">
            {format(weekStart, "yyyy년 M월 d일", { locale: ko })} ~{" "}
            {format(addDays(weekStart, 6), "M월 d일", { locale: ko })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl ml-2"
            onClick={() => setCurrentDate(new Date())}
          >
            오늘
          </Button>
        </div>
      </div>

      {/* Center Filter */}
      {userCenters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
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
      <div className="rounded-3xl bg-white/70 backdrop-blur-sm shadow-md overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border/30">
          <div />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className="py-3 text-center border-l border-border/20"
              >
                <p className="text-xs text-muted-foreground">
                  {format(day, "EEE", { locale: ko })}
                </p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    isToday
                      ? "text-white bg-primary rounded-full w-7 h-7 flex items-center justify-center mx-auto"
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
                className="h-16 flex items-start justify-end pr-2 pt-0.5"
              >
                <span className="text-[10px] text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const daySchedules = filteredSchedules.filter(
              (s) => s.date === dayStr
            );
            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-border/20 cursor-pointer"
                onClick={() => handleCellClick(day)}
              >
                {/* Hour Lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-border/10"
                  />
                ))}

                {/* Schedule Blocks */}
                {daySchedules.map((schedule) => {
                  const color = getColorForCenter(schedule.center_id);
                  const style = getScheduleStyle(schedule);
                  return (
                    <div
                      key={schedule.id}
                      className="absolute left-0.5 right-0.5 rounded-xl px-1.5 py-1 text-[10px] leading-tight overflow-hidden cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        ...style,
                        backgroundColor: color + "30",
                        borderLeft: `3px solid ${color}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleClick(schedule);
                      }}
                    >
                      <p className="font-medium truncate" style={{ color }}>
                        {schedule.title}
                      </p>
                      <p className="text-muted-foreground truncate">
                        {schedule.start_time.slice(0, 5)} -{" "}
                        {schedule.end_time.slice(0, 5)}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {editSchedule ? "스케줄 수정" : "스케줄 추가"}
            </DialogTitle>
          </DialogHeader>
          <ScheduleForm
            userCenters={userCenters}
            schedule={editSchedule ?? undefined}
            defaultDate={selectedDate}
            onSuccess={() => {
              setDialogOpen(false);
              setEditSchedule(null);
              loadData();
            }}
          />
          {editSchedule && (
            <Button
              variant="ghost"
              className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                handleDelete(editSchedule.id);
                setDialogOpen(false);
                setEditSchedule(null);
              }}
            >
              스케줄 삭제
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
