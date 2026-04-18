import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Calendar,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your_supabase_url_here" &&
    supabaseAnonKey !== "your_supabase_anon_key_here"
  ) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-mint-pink">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 md:px-12 py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient-mint-pink">
          FreeFree
        </h1>
        <div className="flex items-center gap-1 md:gap-2">
          <Link
            href="/login"
            className="px-3 md:px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-primary/80 text-white text-base font-semibold hover:bg-primary/70 transition-colors"
          >
            회원가입
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-5 md:px-12 pt-10 md:pt-20 pb-12 md:pb-16 text-center max-w-3xl mx-auto">
        <p className="text-sm md:text-base font-semibold text-primary mb-5 tracking-[0.2em]">
          FOR FREELANCE COUNSELORS
        </p>
        <h2 className="text-4xl md:text-7xl font-bold text-foreground leading-tight mb-6 md:mb-8">
          프리랜서 상담사의
          <br />
          일정관리를{" "}
          <span className="text-gradient-mint-pink">한눈에</span>
        </h2>
        <p className="text-base md:text-xl text-muted-foreground mb-10 md:mb-12 leading-relaxed">
          여러 상담센터의 일정과 내담자 회기별 기록까지.
          <br className="hidden sm:block" /> 하나의 대시보드로 관리하세요.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-primary/80 text-white text-base md:text-lg font-semibold shadow-md hover:bg-primary/70 transition-colors"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-white/70 backdrop-blur-sm text-foreground text-base md:text-lg font-semibold hover:bg-white/90 transition-colors"
          >
            로그인
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 md:px-12 py-10 md:py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Reveal delay={0}>
            <FeatureCard
              Icon={Calendar}
              title="통합 캘린더"
              description="모든 센터의 예약을 주간 뷰에서 한눈에. 센터별 색상으로 시각적으로 구분합니다."
            />
          </Reveal>
          <Reveal delay={180}>
            <FeatureCard
              Icon={Building2}
              title="다중 센터 관리"
              description="출근하는 센터를 자유롭게 추가하고, 센터별 근무 시간을 자동으로 집계합니다."
            />
          </Reveal>
          <Reveal delay={360}>
            <FeatureCard
              Icon={Users}
              title="내담자 관리"
              description="내담자 정보와 상담 회기를 센터별로 체계적으로 기록합니다."
            />
          </Reveal>
          <Reveal delay={540}>
            <FeatureCard
              Icon={ClipboardList}
              title="심리검사 기록"
              description="MMPI-2, SCT, HTP 등 내담자별 검사 이력을 간편하게 저장합니다."
            />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-12 pt-8 pb-16 md:pb-24 text-center">
        <Reveal>
          <div className="max-w-2xl mx-auto rounded-3xl bg-white/70 backdrop-blur-sm shadow-md p-8 md:p-14 animate-float">
            <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-5">
              지금 바로 시작해보세요
            </h3>
            <p className="text-base md:text-xl text-muted-foreground mb-8">
              흩어진 일정과 기록을 모아, 상담사의 시간을 돌려드려요.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-3.5 rounded-xl bg-primary/80 text-white text-base md:text-lg font-semibold shadow-md hover:bg-primary/70 transition-colors"
            >
              무료로 시작하기
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        © 2026 FreeFree
      </footer>
    </main>
  );
}

function FeatureCard({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-2xl bg-gradient-mint-pink-vivid text-white flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2.5">
        {title}
      </h3>
      <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
