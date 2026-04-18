"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const name = (formData.get("name") as string) || null;
  const phone = (formData.get("phone") as string) || null;

  const { error } = await supabase
    .from("profiles")
    .update({ name, phone })
    .eq("id", user.id);

  if (error) return { error: "프로필 업데이트에 실패했습니다." };

  revalidatePath("/settings");
  return { success: true };
}
