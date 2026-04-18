"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getClients(centerId?: string, search?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("clients")
    .select("*, centers(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (centerId) query = query.eq("center_id", centerId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data } = await query;
  return data ?? [];
}

export async function getClientDetail(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("*, centers(name)")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) return null;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", clientId)
    .eq("user_id", user.id)
    .order("session_number", { ascending: false });

  return { ...client, sessions: sessions ?? [] };
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const center_id = formData.get("center_id") as string;
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const birth_date = (formData.get("birth_date") as string) || null;
  const gender = (formData.get("gender") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!center_id || !name?.trim()) {
    return { error: "센터와 이름을 입력해주세요." };
  }

  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    center_id,
    name,
    phone,
    email,
    birth_date,
    gender,
    notes,
  });

  if (error) return { error: "내담자 등록에 실패했습니다." };

  revalidatePath("/clients");
  return { success: true };
}

export async function updateClient(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const birth_date = (formData.get("birth_date") as string) || null;
  const gender = (formData.get("gender") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name?.trim()) return { error: "이름을 입력해주세요." };

  const { error } = await supabase
    .from("clients")
    .update({ name, phone, email, birth_date, gender, notes })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) return { error: "내담자 수정에 실패했습니다." };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) return { error: "내담자 삭제에 실패했습니다." };

  revalidatePath("/clients");
  return { success: true };
}

export async function createSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const client_id = formData.get("client_id") as string;
  const center_id = formData.get("center_id") as string;
  const session_date = formData.get("session_date") as string;
  const duration_minutes = parseInt(
    (formData.get("duration_minutes") as string) || "50",
    10
  );
  const session_type = (formData.get("session_type") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!client_id || !center_id || !session_date) {
    return { error: "필수 항목을 입력해주세요." };
  }

  // 다음 회기 번호
  const { data: lastSession } = await supabase
    .from("sessions")
    .select("session_number")
    .eq("client_id", client_id)
    .eq("user_id", user.id)
    .order("session_number", { ascending: false })
    .limit(1)
    .single();

  const session_number = (lastSession?.session_number ?? 0) + 1;

  const { error } = await supabase.from("sessions").insert({
    user_id: user.id,
    client_id,
    center_id,
    session_number,
    session_date,
    duration_minutes,
    session_type,
    notes,
  });

  if (error) return { error: "상담 기록 등록에 실패했습니다." };

  revalidatePath(`/clients/${client_id}`);
  return { success: true };
}

export async function deleteSession(sessionId: string, clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: "상담 기록 삭제에 실패했습니다." };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
