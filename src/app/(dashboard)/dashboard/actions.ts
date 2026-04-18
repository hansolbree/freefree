"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
