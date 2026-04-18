"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  createSession,
  deleteSession,
} from "@/app/(dashboard)/clients/actions";

interface ClientData {
  id: string;
  name: string;
  center_id: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
  notes: string | null;
  centers: { name: string } | null;
}

interface SessionData {
  id: string;
  session_number: number;
  session_date: string;
  duration_minutes: number;
  session_type: string | null;
  notes: string | null;
}

interface UserCenterData {
  center_id: string;
  color: string;
}

interface ClientDetailClientProps {
  client: ClientData;
  sessions: SessionData[];
  userCenters: UserCenterData[];
}

export function ClientDetailClient({
  client,
  sessions,
  userCenters,
}: ClientDetailClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const centerColor =
    userCenters.find((uc) => uc.center_id === client.center_id)?.color ??
    "#6ECFBD";

  async function handleCreateSession(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("client_id", client.id);
    formData.set("center_id", client.center_id);
    const result = await createSession(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm("이 상담 기록을 삭제하시겠습니까?")) return;
    await deleteSession(sessionId, client.id);
  }

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        내담자 목록
      </Link>

      {/* Client Info */}
      <Card className="rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-md mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ backgroundColor: centerColor }}
            >
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {client.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {client.centers?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {client.phone ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </div>
            ) : null}
            {client.email ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </div>
            ) : null}
            {client.birth_date ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {client.birth_date}
              </div>
            ) : null}
            {client.gender ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {client.gender}
              </div>
            ) : null}
          </div>

          {client.notes ? (
            <>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Sessions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">
          상담 기록{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({sessions.length}회기)
          </span>
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          기록 추가
        </Button>
      </div>

      {/* New Session Form */}
      {showForm && (
        <Card className="rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm mb-4">
          <CardContent className="p-4">
            <form action={handleCreateSession} className="space-y-3">
              {error && (
                <div className="rounded-xl bg-destructive/10 p-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="session_date" className="text-xs">
                    상담 날짜 *
                  </Label>
                  <Input
                    id="session_date"
                    name="session_date"
                    type="date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration_minutes" className="text-xs">
                    시간 (분)
                  </Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    defaultValue="50"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="session_type" className="text-xs">
                  상담 유형
                </Label>
                <Input
                  id="session_type"
                  name="session_type"
                  placeholder="개인상담, 집단상담 등"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">
                  상담 메모
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="상담 내용 메모..."
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="rounded-xl bg-gradient-mint-pink-vivid text-white"
                >
                  {loading ? "저장 중..." : "저장"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setShowForm(false)}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          아직 상담 기록이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: centerColor }}
                    >
                      {session.session_number}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.session_number}회기
                        {session.session_type && ` · ${session.session_type}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.session_date} · {session.duration_minutes}분
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {session.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground ml-11">
                    {session.notes}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
