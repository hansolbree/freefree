"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function hasSupabaseAuthCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith("sb-") && c.includes("auth-token"));
}

// 랜딩 진입 즉시 쿠키만 검사해서 세션 있으면 대시보드로 점프.
// 서버 getUser() 왕복을 제거해 첫 HTML을 정적 수준으로 빠르게 내려보낸다.
export function AutoRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (hasSupabaseAuthCookie()) {
      router.replace("/dashboard");
    }
  }, [router]);
  return null;
}
