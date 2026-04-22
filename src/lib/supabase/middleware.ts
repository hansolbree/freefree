import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 랜딩(/)은 공개 정적 페이지 — auth 갱신 생략해서 TTFB 단축
  // (로그인 상태인 경우 클라이언트 AutoRedirect가 /dashboard로 점프시킴)
  if (request.nextUrl.pathname === "/") {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase가 설정되지 않은 경우 미들웨어를 건너뜀
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === "your_supabase_url_here" ||
    supabaseAnonKey === "your_supabase_anon_key_here"
  ) {
    return supabaseResponse;
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  // 쿠키만 보고 세션 유무 판단 — Supabase 네트워크 호출 생략 (~200ms 절약)
  // 실제 검증은 페이지/서버 액션에서 수행하므로 RLS로 보안은 유지됨
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasAuthCookie && !isAuthRoute && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasAuthCookie && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 실제 세션 검증 및 토큰 리프레시는 각 페이지/서버 액션의
  // createClient() 호출 시점에 Supabase SSR 클라이언트가 자동 수행
  return supabaseResponse;
}
