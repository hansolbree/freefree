"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mint-pink px-4">
      <Card className="w-full max-w-md rounded-3xl shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-gradient-mint-pink">
            FreeFree
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            프리랜서 심리상담사 통합 대시보드
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registered && (
            <div className="mb-4 rounded-2xl bg-primary/10 p-3 text-sm text-primary">
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}
          {state?.error && (
            <div className="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="rounded-xl"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity"
              disabled={pending}
            >
              {pending ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              회원가입
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
