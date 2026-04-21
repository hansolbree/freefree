"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, Shield, Users, Building2, Calendar, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  centers: number;
  clients: number;
  sessions: number;
  lectures: number;
  last_activity: string | null;
};

type Totals = {
  users: number;
  centers: number;
  clients: number;
  sessions: number;
  lectures: number;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return format(new Date(d), "yyyy.MM.dd", { locale: ko });
  } catch {
    return "—";
  }
}

export function AdminPageClient({
  users,
  totals,
}: {
  users: AdminUserRow[];
  totals: Totals;
}) {
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q)
    );
  });

  const stats = [
    { label: "가입자", value: totals.users, Icon: Shield },
    { label: "센터", value: totals.centers, Icon: Building2 },
    { label: "내담자", value: totals.clients, Icon: Users },
    { label: "세션", value: totals.sessions, Icon: Calendar },
    { label: "강의", value: totals.lectures, Icon: BookOpen },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          어드민
        </h1>
        <p className="text-base text-muted-foreground mt-1">
          가입자 목록과 서비스 활용도 현황
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이메일, 이름, 전화번호로 검색"
            className="pl-11 rounded-xl h-11 text-base"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">사용자</th>
                <th className="text-left font-medium px-4 py-3">전화</th>
                <th className="text-center font-medium px-3 py-3">센터</th>
                <th className="text-center font-medium px-3 py-3">내담자</th>
                <th className="text-center font-medium px-3 py-3">세션</th>
                <th className="text-center font-medium px-3 py-3">강의</th>
                <th className="text-left font-medium px-4 py-3">가입일</th>
                <th className="text-left font-medium px-4 py-3">최근 활동</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    결과 없음
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border/20 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {u.name ?? "(이름 없음)"}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {u.phone ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      {u.centers}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      {u.clients}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      {u.sessions}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      {u.lectures}
                    </td>
                    <td className="px-4 py-3 text-foreground/80 tabular-nums">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-foreground/80 tabular-nums">
                      {formatDate(u.last_activity)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border/30">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              결과 없음
            </div>
          ) : (
            filtered.map((u) => (
              <div key={u.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {u.name ?? "(이름 없음)"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
                    {formatDate(u.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-muted/60 px-2 py-1">
                    센터 {u.centers}
                  </span>
                  <span className="rounded-full bg-muted/60 px-2 py-1">
                    내담자 {u.clients}
                  </span>
                  <span className="rounded-full bg-muted/60 px-2 py-1">
                    세션 {u.sessions}
                  </span>
                  <span className="rounded-full bg-muted/60 px-2 py-1">
                    강의 {u.lectures}
                  </span>
                </div>
                {u.last_activity && (
                  <p className="text-xs text-muted-foreground mt-2">
                    최근 활동 {formatDate(u.last_activity)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
