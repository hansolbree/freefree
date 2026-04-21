import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { AdminPageClient, type AdminUserRow } from "./page-client";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  const [profilesRes, centersRes, clientsRes, sessionsRes, lecturesRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, email, name, phone, created_at")
        .order("created_at", { ascending: false }),
      admin.from("centers").select("user_id"),
      admin.from("clients").select("user_id"),
      admin.from("sessions").select("user_id, session_date"),
      admin.from("lectures").select("user_id, lecture_date"),
    ]);

  const profiles = profilesRes.data ?? [];

  const centerCount = new Map<string, number>();
  for (const row of centersRes.data ?? []) {
    centerCount.set(row.user_id, (centerCount.get(row.user_id) ?? 0) + 1);
  }

  const clientCount = new Map<string, number>();
  for (const row of clientsRes.data ?? []) {
    clientCount.set(row.user_id, (clientCount.get(row.user_id) ?? 0) + 1);
  }

  const sessionCount = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  for (const row of sessionsRes.data ?? []) {
    sessionCount.set(row.user_id, (sessionCount.get(row.user_id) ?? 0) + 1);
    const prev = lastActivity.get(row.user_id);
    if (!prev || row.session_date > prev) {
      lastActivity.set(row.user_id, row.session_date);
    }
  }

  const lectureCount = new Map<string, number>();
  for (const row of lecturesRes.data ?? []) {
    lectureCount.set(row.user_id, (lectureCount.get(row.user_id) ?? 0) + 1);
    const prev = lastActivity.get(row.user_id);
    if (!prev || row.lecture_date > prev) {
      lastActivity.set(row.user_id, row.lecture_date);
    }
  }

  const users: AdminUserRow[] = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name,
    phone: p.phone,
    created_at: p.created_at,
    centers: centerCount.get(p.id) ?? 0,
    clients: clientCount.get(p.id) ?? 0,
    sessions: sessionCount.get(p.id) ?? 0,
    lectures: lectureCount.get(p.id) ?? 0,
    last_activity: lastActivity.get(p.id) ?? null,
  }));

  const totals = {
    users: users.length,
    centers: centersRes.data?.length ?? 0,
    clients: clientsRes.data?.length ?? 0,
    sessions: sessionsRes.data?.length ?? 0,
    lectures: lecturesRes.data?.length ?? 0,
  };

  return <AdminPageClient users={users} totals={totals} />;
}
