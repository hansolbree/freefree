"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function register(prevState: { error: string; success?: boolean } | null, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "모든 필드를 입력해주세요." };
  }

  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { error: "회원가입에 실패했습니다. 다시 시도해주세요." };
  }

  redirect("/login?registered=true");
}
