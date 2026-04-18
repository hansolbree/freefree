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
  Briefcase,
  Plus,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  createSession,
  updateSession,
  deleteSession,
  createClientTest,
  deleteClientTest,
} from "@/app/(dashboard)/clients/actions";

interface ClientData {
  id: string;
  name: string;
  center_id: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
  occupation: string | null;
  notes: string | null;
  centers: { name: string } | null;
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

interface SessionData {
  id: string;
  session_number: number;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  session_type: string | null;
  notes: string | null;
}

interface ClientTestData {
  id: string;
  test_name: string;
  test_date: string;
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
  clientTests: ClientTestData[];
}

export function ClientDetailClient({
  client,
  sessions,
  userCenters,
  clientTests,
}: ClientDetailClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const centerColor =
    userCenters.find((uc) => uc.center_id === client.center_id)?.color ??
    "#6ECFBD";

  // 다음 회기번호 자동 계산
  const nextSessionNumber =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.session_number)) + 1
      : 1;

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
      setError(null);
    }
  }

  async function handleUpdateSession(formData: FormData) {
    if (!editingSession) return;
    setLoading(true);
    setError(null);
    formData.set("client_id", client.id);
    const result = await updateSession(editingSession.id, formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingSession(null);
      setError(null);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm("이 상담 기록을 삭제하시겠습니까?")) return;
    await deleteSession(sessionId, client.id);
  }

  async function handleCreateTest(formData: FormData) {
    setTestLoading(true);
    setTestError(null);
    formData.set("client_id", client.id);
    const result = await createClientTest(formData);
    setTestLoading(false);
    if (result.error) {
      setTestError(result.error);
    } else {
      setShowTestForm(false);
      setTestError(null);
    }
  }

  async function handleDeleteTest(testId: string) {
    if (!confirm("이 심리검사 기록을 삭제하시겠습니까?")) return;
    await deleteClientTest(testId, client.id);
  }

  function SessionForm({
    session,
    onSubmit,
    onCancel,
  }: {
    session?: SessionData;
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
  }) {
    return (
      <Card className="rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm mb-4">
        <CardContent className="p-4">
          <form action={onSubmit} className="space-y-3">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="session_date" className="text-sm">
                  상담 날짜 *
                </Label>
                <Input
                  id="session_date"
                  name="session_date"
                  type="date"
                  defaultValue={
                    session?.session_date ?? format(new Date(), "yyyy-MM-dd")
                  }
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="session_number" className="text-sm">
                  회기번호 *
                </Label>
                <Input
                  id="session_number"
                  name="session_number"
                  type="number"
                  min={1}
                  defaultValue={session?.session_number ?? nextSessionNumber}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-sm">
                  시작 시간
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  defaultValue={session?.start_time?.slice(0, 5) ?? "10:00"}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-sm">
                  종료 시간
                </Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  defaultValue={session?.end_time?.slice(0, 5) ?? "11:00"}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session_type" className="text-sm">
                상담 유형
              </Label>
              <Input
                id="session_type"
                name="session_type"
                defaultValue={session?.session_type ?? ""}
                placeholder="개인상담, 해석상담, 집단상담 등"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm">
                상담 메모
              </Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={session?.notes ?? ""}
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
                {loading ? "저장 중..." : session ? "수정" : "저장"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={onCancel}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-base text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        내담자 목록
      </Link>

      {/* Client Info */}
      <Card className="rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-md mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ backgroundColor: centerColor }}
            >
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {client.name}
              </h1>
              <p className="text-base text-muted-foreground mt-0.5">
                {client.centers?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base">
            {client.phone ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {client.phone}
              </div>
            ) : null}
            {client.email ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {client.email}
              </div>
            ) : null}
            {calculateAge(client.birth_date) != null ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {calculateAge(client.birth_date)}세
              </div>
            ) : null}
            {client.gender ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {client.gender}
              </div>
            ) : null}
            {client.occupation ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                {client.occupation}
              </div>
            ) : null}
          </div>

          {client.notes ? (
            <>
              <Separator className="my-5" />
              <p className="text-base text-muted-foreground">{client.notes}</p>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* 심리검사 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">
          심리검사{" "}
          <span className="text-muted-foreground font-normal text-base">
            ({clientTests.length}건)
          </span>
        </h2>
        <Button
          onClick={() => {
            setShowTestForm(!showTestForm);
            setTestError(null);
          }}
          className="rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          검사 추가
        </Button>
      </div>

      {showTestForm && (
        <Card className="rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm mb-4">
          <CardContent className="p-4">
            <form action={handleCreateTest} className="space-y-3">
              {testError && (
                <div className="rounded-xl bg-destructive/10 p-2 text-sm text-destructive">
                  {testError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="test_name" className="text-sm">
                  검사명 *
                </Label>
                <Input
                  id="test_name"
                  name="test_name"
                  placeholder="MMPI-2, SCT, HTP 등"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="test_date" className="text-sm">
                  검사 날짜 *
                </Label>
                <Input
                  id="test_date"
                  name="test_date"
                  type="date"
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="test_notes" className="text-sm">
                  메모
                </Label>
                <Textarea
                  id="test_notes"
                  name="notes"
                  placeholder="검사 결과 또는 특이사항..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={testLoading}
                  size="sm"
                  className="rounded-xl bg-gradient-mint-pink-vivid text-white"
                >
                  {testLoading ? "저장 중..." : "저장"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setShowTestForm(false);
                    setTestError(null);
                  }}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {clientTests.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          등록된 심리검사가 없습니다
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 mb-2">
          {clientTests.map((test) => (
            <div
              key={test.id}
              className="group flex items-center gap-3 rounded-2xl pl-5 pr-3 py-3 text-base font-medium border border-border/40 bg-white/70 backdrop-blur-sm shadow-sm"
              title={test.notes ? `${test.test_date}\n${test.notes}` : test.test_date}
            >
              <span className="text-foreground font-bold">{test.test_name}</span>
              <span className="text-sm text-muted-foreground">{test.test_date}</span>
              <button
                onClick={() => handleDeleteTest(test.id)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sessions */}
      <div className="flex items-center justify-between mb-4 mt-6">
        <h2 className="text-lg font-bold text-foreground">
          상담 기록{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({sessions.length}회기)
          </span>
        </h2>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingSession(null);
            setError(null);
          }}
          className="rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          기록 추가
        </Button>
      </div>

      {/* New Session Form */}
      {showForm && !editingSession && (
        <SessionForm
          onSubmit={handleCreateSession}
          onCancel={() => {
            setShowForm(false);
            setError(null);
          }}
        />
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          아직 상담 기록이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id}>
              {/* Edit Form (inline) */}
              {editingSession?.id === session.id ? (
                <SessionForm
                  session={session}
                  onSubmit={handleUpdateSession}
                  onCancel={() => {
                    setEditingSession(null);
                    setError(null);
                  }}
                />
              ) : (
                <Card className="rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ backgroundColor: centerColor }}
                        >
                          {session.session_number}
                        </div>
                        <div>
                          <p className="text-base font-medium text-foreground">
                            {session.session_number}회기
                            {session.session_type &&
                              ` · ${session.session_type}`}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {session.session_date}
                            {session.start_time && session.end_time
                              ? ` · ${session.start_time.slice(0, 5)}-${session.end_time.slice(0, 5)}`
                              : ` · ${session.duration_minutes}분`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingSession(session);
                            setShowForm(false);
                            setError(null);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {session.notes ? (
                      <p className="mt-2 text-base text-muted-foreground ml-13">
                        {session.notes}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
