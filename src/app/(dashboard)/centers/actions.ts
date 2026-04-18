"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getCenters() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("centers")
    .select("*, user_centers(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function createCenter(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const name = formData.get("name") as string;
  const address = (formData.get("address") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const color = (formData.get("color") as string) || "#6ECFBD";

  if (!name?.trim()) return { error: "센터 이름을 입력해주세요." };

  const { data: center, error } = await supabase
    .from("centers")
    .insert({ user_id: user.id, name, address, phone, notes })
    .select()
    .single();

  if (error) {
    console.error("Center create error:", error.message);
    return { error: error.message };
  }

  await supabase.from("user_centers").insert({
    user_id: user.id,
    center_id: center.id,
    color,
    is_active: true,
  });

  revalidatePath("/centers");
  return { success: true };
}

export async function updateCenter(centerId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const name = formData.get("name") as string;
  const address = (formData.get("address") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const color = (formData.get("color") as string) || "#6ECFBD";

  if (!name?.trim()) return { error: "센터 이름을 입력해주세요." };

  const { error } = await supabase
    .from("centers")
    .update({ name, address, phone, notes })
    .eq("id", centerId)
    .eq("user_id", user.id);

  if (error) return { error: "센터 수정에 실패했습니다." };

  await supabase
    .from("user_centers")
    .update({ color })
    .eq("center_id", centerId)
    .eq("user_id", user.id);

  revalidatePath("/centers");
  return { success: true };
}

export async function deleteCenter(centerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  await supabase
    .from("user_centers")
    .delete()
    .eq("center_id", centerId)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("centers")
    .delete()
    .eq("id", centerId)
    .eq("user_id", user.id);

  if (error) return { error: "센터 삭제에 실패했습니다." };

  revalidatePath("/centers");
  return { success: true };
}
