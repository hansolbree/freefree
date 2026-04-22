import { addDays, format, startOfWeek } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await createClient();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const [sessionsRes, lecturesRes, userCentersRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, clients(name), centers(name)")
      .eq("user_id", user.id)
      .gte("session_date", startStr)
      .lte("session_date", endStr)
      .order("start_time", { ascending: true }),
    supabase
      .from("lectures")
      .select("*, centers(name)")
      .eq("user_id", user.id)
      .gte("lecture_date", startStr)
      .lte("lecture_date", endStr)
      .order("start_time", { ascending: true }),
    supabase
      .from("user_centers")
      .select("*, centers(id, name)")
      .eq("user_id", user.id)
      .eq("is_active", true),
  ]);

  return (
    <WeeklyCalendar
      initialDate={now.toISOString()}
      initialSessions={sessionsRes.data ?? []}
      initialLectures={lecturesRes.data ?? []}
      initialUserCenters={userCentersRes.data ?? []}
    />
  );
}
