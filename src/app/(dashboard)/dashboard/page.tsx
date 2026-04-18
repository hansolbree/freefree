import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/logout/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  let userEmail: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // Supabase 미설정 시 무시
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">FreeFree 대시보드</h1>
        {userEmail && (
          <p className="text-gray-500">{userEmail}로 로그인됨</p>
        )}
        <p className="text-gray-400">
          통합 캘린더는 Phase 5에서 구현됩니다.
        </p>
        <form action={logout}>
          <Button variant="outline" type="submit">
            로그아웃
          </Button>
        </form>
      </div>
    </div>
  );
}
