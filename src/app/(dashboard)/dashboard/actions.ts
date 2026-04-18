"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getSchedules(startDate: string, endDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("schedules")
    .select("*, centers(name)")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
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

export async function createSchedule(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const center_id = formData.get("center_id") as string;
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!center_id || !title?.trim() || !date || !start_time || !end_time) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const { error } = await supabase.from("schedules").insert({
    user_id: user.id,
    center_id,
    title,
    date,
    start_time,
    end_time,
    notes,
  });

  if (error) return { error: "스케줄 생성에 실패했습니다." };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSchedule(scheduleId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const center_id = formData.get("center_id") as string;
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!center_id || !title?.trim() || !date || !start_time || !end_time) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const { error } = await supabase
    .from("schedules")
    .update({ center_id, title, date, start_time, end_time, notes })
    .eq("id", scheduleId)
    .eq("user_id", user.id);

  if (error) return { error: "스케줄 수정에 실패했습니다." };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("user_id", user.id);

  if (error) return { error: "스케줄 삭제에 실패했습니다." };

  revalidatePath("/dashboard");
  return { success: true };
}
