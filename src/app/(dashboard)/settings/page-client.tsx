"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";

interface SettingsClientProps {
  profile: {
    name: string | null;
    phone: string | null;
    email: string;
  };
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await updateProfile(formData);
    setLoading(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "프로필이 업데이트되었습니다." });
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          프로필 정보를 관리하세요
        </p>
      </div>

      <Card className="rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-md">
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            {message && (
              <div
                className={`rounded-2xl p-3 text-sm ${
                  message.type === "success"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="rounded-xl bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.name ?? ""}
                placeholder="이름을 입력하세요"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={profile.phone ?? ""}
                placeholder="010-0000-0000"
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {loading ? "저장 중..." : "프로필 저장"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
