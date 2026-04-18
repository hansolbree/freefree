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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">FreeFree</CardTitle>
          <CardDescription>
            프리랜서 심리상담사 통합 대시보드
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registered && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}
          {state?.error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
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
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-500">
            계정이 없으신가요?{" "}
            <Link href="/register" className="font-medium text-gray-900 hover:underline">
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
