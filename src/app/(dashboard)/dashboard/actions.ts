"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getCalendarData(startDate: string, endDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { sessions: [], lectures: [], userCenters: [] };
  }

  const [sessionsRes, lecturesRes, userCentersRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, clients(name), centers(name)")
      .eq("user_id", user.id)
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("start_time", { ascending: true }),
    supabase
      .from("lectures")
      .select("*, centers(name)")
      .eq("user_id", user.id)
      .gte("lecture_date", startDate)
      .lte("lecture_date", endDate)
      .order("start_time", { ascending: true }),
    supabase
      .from("user_centers")
      .select("*, centers(id, name)")
      .eq("user_id", user.id)
      .eq("is_active", true),
  ]);

  return {
    sessions: sessionsRes.data ?? [],
    lectures: lecturesRes.data ?? [],
    userCenters: userCentersRes.data ?? [],
  };
}

export async function getSessions(startDate: string, endDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("sessions")
    .select("*, clients(name), centers(name)")
    .eq("user_id", user.id)
    .gte("session_date", startDate)
    .lte("session_date", endDate)
    .order("start_time", { ascending: true });

  return data ?? [];
}

export async function getUserCenters() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_centers")
    .select("*, centers(id, name)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  return data ?? [];
}

export async function getClientsByCenter(centerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("center_id", centerId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return data ?? [];
}

export async function createCalendarSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const center_id = formData.get("center_id") as string;
  const client_id = formData.get("client_id") as string;
  const session_date = formData.get("session_date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const session_type = (formData.get("session_type") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!center_id || !client_id || !session_date || !start_time || !end_time) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  // 회기번호: 직접 입력하거나 자동 계산
  const session_number_input = formData.get("session_number") as string;
  let session_number: number;

  if (session_number_input && parseInt(session_number_input, 10) > 0) {
    session_number = parseInt(session_number_input, 10);
  } else {
    const { data: lastSession } = await supabase
      .from("sessions")
      .select("session_number")
      .eq("client_id", client_id)
      .eq("user_id", user.id)
      .order("session_number", { ascending: false })
      .limit(1)
      .single();

    session_number = (lastSession?.session_number ?? 0) + 1;
  }

  // start_time, end_time으로 duration 계산
  const [sh, sm] = start_time.split(":").map(Number);
  const [eh, em] = end_time.split(":").map(Number);
  const duration_minutes = (eh * 60 + em) - (sh * 60 + sm);

  const { error } = await supabase.from("sessions").insert({
    user_id: user.id,
    center_id,
    client_id,
    session_number,
    session_date,
    start_time,
    end_time,
    duration_minutes: duration_minutes > 0 ? duration_minutes : 50,
    session_type,
    notes,
  });

  if (error) return { error: "예약 생성에 실패했습니다." };

  revalidatePath("/dashboard");
  revalidatePath(`/clients/${client_id}`);
  return { success: true };
}

export async function updateCalendarSession(
  sessionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const center_id = formData.get("center_id") as string;
  const client_id = formData.get("client_id") as string;
  const session_date = formData.get("session_date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const session_type = (formData.get("session_type") as string) || null;
  const session_number_input = formData.get("session_number") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!center_id || !client_id || !session_date || !start_time || !end_time) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const [sh, sm] = start_time.split(":").map(Number);
  const [eh, em] = end_time.split(":").map(Number);
  const duration_minutes = (eh * 60 + em) - (sh * 60 + sm);

  const session_number =
    session_number_input && parseInt(session_number_input, 10) > 0
      ? parseInt(session_number_input, 10)
      : undefined;

  const { error } = await supabase
    .from("sessions")
    .update({
      center_id,
      client_id,
      session_date,
      start_time,
      end_time,
      duration_minutes: duration_minutes > 0 ? duration_minutes : 50,
      session_type,
      notes,
      ...(session_number !== undefined && { session_number }),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: "예약 수정에 실패했습니다." };

  revalidatePath("/dashboard");
  revalidatePath(`/clients/${client_id}`);
  return { success: true };
}

export async function deleteCalendarSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 삭제 전에 client_id 가져오기
  const { data: session } = await supabase
    .from("sessions")
    .select("client_id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: "예약 삭제에 실패했습니다." };

  revalidatePath("/dashboard");
  if (session?.client_id) {
    revalidatePath(`/clients/${session.client_id}`);
  }
  return { success: true };
}

// ============================================
// 강의 (lectures)
// ============================================

export async function getLectures(startDate: string, endDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("lectures")
    .select("*, centers(name)")
    .eq("user_id", user.id)
    .gte("lecture_date", startDate)
    .lte("lecture_date", endDate)
    .order("start_time", { ascending: true });

  return data ?? [];
}

function addDaysISO(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export async function createLecture(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = (formData.get("title") as string)?.trim();
  const center_id = (formData.get("center_id") as string) || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const audience = (formData.get("audience") as string)?.trim() || null;
  const color = (formData.get("color") as string) || "#6ECFBD";
  const lecture_date = formData.get("lecture_date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const feeRaw = formData.get("fee") as string;
  const fee = feeRaw && feeRaw.trim() !== "" ? parseInt(feeRaw, 10) : null;
  const fee_paid = formData.get("fee_paid") === "on";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const recurrence = (formData.get("recurrence") as string) || "none"; // none | weekly | biweekly
  const countRaw = formData.get("recurrence_count") as string;
  const recurrenceCount = Math.max(
    1,
    Math.min(12, countRaw ? parseInt(countRaw, 10) || 1 : 1)
  );

  if (!title || !lecture_date || !start_time || !end_time) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const intervalDays =
    recurrence === "weekly" ? 7 : recurrence === "biweekly" ? 14 : 0;
  const total = intervalDays > 0 ? recurrenceCount : 1;
  const series_id = total > 1 ? crypto.randomUUID() : null;

  const rows = Array.from({ length: total }, (_, i) => ({
    user_id: user.id,
    series_id,
    title,
    center_id,
    location,
    audience,
    color,
    lecture_date:
      intervalDays > 0 ? addDaysISO(lecture_date, i * intervalDays) : lecture_date,
    start_time,
    end_time,
    fee,
    fee_paid,
    notes,
  }));

  const { error } = await supabase.from("lectures").insert(rows);

  if (error) {
    console.error("createLecture error:", error);
    return { error: `강의 생성에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLecture(lectureId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = (formData.get("title") as string)?.trim();
  const center_id = (formData.get("center_id") as string) || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const audience = (formData.get("audience") as string)?.trim() || null;
  const color = (formData.get("color") as string) || "#6ECFBD";
  const lecture_date = formData.get("lecture_date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const feeRaw = formData.get("fee") as string;
  const fee = feeRaw && feeRaw.trim() !== "" ? parseInt(feeRaw, 10) : null;
  const fee_paid = formData.get("fee_paid") === "on";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!title || !lecture_date || !start_time || !end_time) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const { error } = await supabase
    .from("lectures")
    .update({
      title,
      center_id,
      location,
      audience,
      color,
      lecture_date,
      start_time,
      end_time,
      fee,
      fee_paid,
      notes,
    })
    .eq("id", lectureId)
    .eq("user_id", user.id);

  if (error) return { error: "강의 수정에 실패했습니다." };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteLecture(lectureId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("lectures")
    .delete()
    .eq("id", lectureId)
    .eq("user_id", user.id);

  if (error) return { error: "강의 삭제에 실패했습니다." };

  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================
// 통합 검색
// ============================================

export type SearchResult = {
  kind: "session" | "lecture";
  id: string;
  date: string;
  start_time: string | null;
  title: string;
  subtitle: string;
  color?: string;
  center_id?: string | null;
};

export async function searchEvents(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const pattern = `%${q.replace(/[,%()]/g, (m) => `\\${m}`)}%`;

  const [s1, s2, s3, l1] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "id, center_id, session_date, start_time, session_type, notes, clients(name), centers(name)"
      )
      .eq("user_id", user.id)
      .or(`notes.ilike.${pattern},session_type.ilike.${pattern}`),
    supabase
      .from("sessions")
      .select(
        "id, center_id, session_date, start_time, session_type, notes, clients!inner(name), centers(name)"
      )
      .eq("user_id", user.id)
      .ilike("clients.name", pattern),
    supabase
      .from("sessions")
      .select(
        "id, center_id, session_date, start_time, session_type, notes, clients(name), centers!inner(name)"
      )
      .eq("user_id", user.id)
      .ilike("centers.name", pattern),
    supabase
      .from("lectures")
      .select("*, centers(name)")
      .eq("user_id", user.id)
      .or(
        `title.ilike.${pattern},location.ilike.${pattern},audience.ilike.${pattern},notes.ilike.${pattern}`
      ),
  ]);

  type SessionRow = {
    id: string;
    center_id: string;
    session_date: string;
    start_time: string | null;
    session_type: string | null;
    notes: string | null;
    clients: { name: string } | null;
    centers: { name: string } | null;
  };
  type LectureRow = {
    id: string;
    center_id: string | null;
    lecture_date: string;
    start_time: string;
    title: string;
    location: string | null;
    audience: string | null;
    color: string;
    centers: { name: string } | null;
  };

  const sessionMap = new Map<string, SessionRow>();
  for (const s of [
    ...((s1.data ?? []) as SessionRow[]),
    ...((s2.data ?? []) as SessionRow[]),
    ...((s3.data ?? []) as SessionRow[]),
  ]) {
    sessionMap.set(s.id, s);
  }

  const sessionResults: SearchResult[] = Array.from(sessionMap.values()).map(
    (s) => ({
      kind: "session" as const,
      id: s.id,
      date: s.session_date,
      start_time: s.start_time,
      center_id: s.center_id,
      title: s.clients?.name ?? "내담자",
      subtitle: [s.centers?.name, s.session_type].filter(Boolean).join(" · "),
    })
  );

  const lectureResults: SearchResult[] = ((l1.data ?? []) as LectureRow[]).map(
    (l) => ({
      kind: "lecture" as const,
      id: l.id,
      date: l.lecture_date,
      start_time: l.start_time,
      color: l.color,
      center_id: l.center_id,
      title: l.title,
      subtitle: [l.centers?.name ?? l.location ?? "외부 강의", l.audience]
        .filter(Boolean)
        .join(" · "),
    })
  );

  const merged = [...sessionResults, ...lectureResults].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return (b.start_time ?? "").localeCompare(a.start_time ?? "");
  });

  return merged.slice(0, 30);
}

export async function deleteLectureSeries(seriesId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("lectures")
    .delete()
    .eq("series_id", seriesId)
    .eq("user_id", user.id);

  if (error) return { error: "강의 시리즈 삭제에 실패했습니다." };

  revalidatePath("/dashboard");
  return { success: true };
}
