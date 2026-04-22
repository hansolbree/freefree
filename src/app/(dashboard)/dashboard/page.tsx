import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";

// 서버는 가벼운 셸만 반환 — 첫 HTML이 즉시 도착하도록 함.
// 데이터는 WeeklyCalendar가 마운트 직후 클라이언트에서 서버 액션으로 조회.
export default function DashboardPage() {
  return (
    <WeeklyCalendar
      initialDate={new Date().toISOString()}
      initialSessions={[]}
      initialLectures={[]}
      initialUserCenters={[]}
    />
  );
}
