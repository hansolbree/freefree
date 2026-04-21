"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function ageToBirthDate(ageInput: string | null): string | null {
  if (!ageInput) return null;
  const age = parseInt(ageInput, 10);
  if (!Number.isFinite(age) || age < 0 || age > 120) return null;
  const year = new Date().getFullYear() - age;
  return `${year}-01-01`;
}

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
  const ageInput = formData.get("age") as string;
  const birth_date = ageToBirthDate(ageInput) ??
    ((formData.get("birth_date") as string) || null);
  const gender = (formData.get("gender") as string) || null;
  const occupation = (formData.get("occupation") as string) || null;
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
    occupation,
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

  const center_id = (formData.get("center_id") as string) || null;
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const ageInput = formData.get("age") as string;
  const birth_date =
    ageInput && ageInput.trim() !== ""
      ? ageToBirthDate(ageInput)
      : ((formData.get("birth_date") as string) || null);
  const gender = (formData.get("gender") as string) || null;
  const occupation = (formData.get("occupation") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name?.trim()) return { error: "이름을 입력해주세요." };
  if (!center_id) return { error: "센터를 선택해주세요." };

  const { error } = await supabase
    .from("clients")
    .update({
      center_id,
      name,
      phone,
      email,
      birth_date,
      gender,
      occupation,
      notes,
    })
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
  const start_time = (formData.get("start_time") as string) || null;
  const end_time = (formData.get("end_time") as string) || null;
  const duration_minutes = parseInt(
    (formData.get("duration_minutes") as string) || "50",
    10
  );
  const session_type = (formData.get("session_type") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!client_id || !center_id || !session_date) {
    return { error: "필수 항목을 입력해주세요." };
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

  const { error } = await supabase.from("sessions").insert({
    user_id: user.id,
    client_id,
    center_id,
    session_number,
    session_date,
    start_time,
    end_time,
    duration_minutes,
    session_type,
    notes,
  });

  if (error) return { error: "상담 기록 등록에 실패했습니다." };

  revalidatePath(`/clients/${client_id}`);
  return { success: true };
}

export async function updateSession(sessionId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const client_id = formData.get("client_id") as string;
  const session_date = formData.get("session_date") as string;
  const start_time = (formData.get("start_time") as string) || null;
  const end_time = (formData.get("end_time") as string) || null;
  const session_number_input = formData.get("session_number") as string;
  const session_number = parseInt(session_number_input, 10);
  const session_type = (formData.get("session_type") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!session_date || !session_number) {
    return { error: "필수 항목을 입력해주세요." };
  }

  let duration_minutes = 50;
  if (start_time && end_time) {
    const [sh, sm] = start_time.split(":").map(Number);
    const [eh, em] = end_time.split(":").map(Number);
    const calc = (eh * 60 + em) - (sh * 60 + sm);
    if (calc > 0) duration_minutes = calc;
  }

  const { error } = await supabase
    .from("sessions")
    .update({
      session_date,
      start_time,
      end_time,
      session_number,
      duration_minutes,
      session_type,
      notes,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: "상담 기록 수정에 실패했습니다." };

  revalidatePath(`/clients/${client_id}`);
  revalidatePath("/dashboard");
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

// 심리검사 CRUD
export async function createClientTest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const client_id = formData.get("client_id") as string;
  const test_name = formData.get("test_name") as string;
  const test_date = formData.get("test_date") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!client_id || !test_name?.trim() || !test_date) {
    return { error: "검사명과 날짜를 입력해주세요." };
  }

  const { error } = await supabase.from("client_tests").insert({
    user_id: user.id,
    client_id,
    test_name,
    test_date,
    notes,
  });

  if (error) {
    console.error("client_tests insert error:", error);
    return { error: `심리검사 등록에 실패했습니다: ${error.message}` };
  }

  revalidatePath(`/clients/${client_id}`);
  return { success: true };
}

export async function deleteClientTest(testId: string, clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("client_tests")
    .delete()
    .eq("id", testId)
    .eq("user_id", user.id);

  if (error) return { error: "심리검사 삭제에 실패했습니다." };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
