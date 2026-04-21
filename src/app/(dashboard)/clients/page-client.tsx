"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClientRecord, deleteClient, updateClient } from "./actions";

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

interface Client {
  id: string;
  name: string;
  center_id: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  occupation: string | null;
  birth_date: string | null;
  notes: string | null;
  is_active: boolean;
  centers: { name: string } | null;
}

interface UserCenter {
  center_id: string;
  color: string;
  centers: { id: string; name: string } | null;
}

export function ClientsPageClient({
  clients,
  userCenters,
}: {
  clients: Client[];
  userCenters: UserCenter[];
}) {
  const [search, setSearch] = useState("");
  const [filterCenter, setFilterCenter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCenterId, setNewCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editCenterId, setEditCenterId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCenter =
      filterCenter === "all" || c.center_id === filterCenter;
    return matchSearch && matchCenter;
  });

  function getCenterColor(centerId: string) {
    return (
      userCenters.find((uc) => uc.center_id === centerId)?.color ?? "#6ECFBD"
    );
  }

  async function handleDelete(e: React.MouseEvent, clientId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 내담자를 삭제하시겠습니까?")) return;
    await deleteClient(clientId);
  }

  function handleEditClick(e: React.MouseEvent, client: Client) {
    e.preventDefault();
    e.stopPropagation();
    setEditingClient(client);
    setEditCenterId(client.center_id);
    setEditError(null);
  }

  async function handleEdit(formData: FormData) {
    if (!editingClient) return;
    setEditLoading(true);
    setEditError(null);
    formData.set("center_id", editCenterId);
    const result = await updateClient(editingClient.id, formData);
    setEditLoading(false);
    if (result.error) {
      setEditError(result.error);
    } else {
      setEditingClient(null);
    }
  }

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("center_id", newCenterId);
    const result = await createClientRecord(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setDialogOpen(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">내담자</h1>
          <p className="text-base text-muted-foreground mt-1">
            내담자를 관리하고 상담 기록을 확인하세요
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-xl bg-gradient-mint-pink-vivid text-white text-base font-semibold hover:opacity-90 transition-opacity gap-2 px-5 py-5" />
            }
          >
            <Plus className="h-4 w-4" />
            내담자 등록
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>새 내담자 등록</DialogTitle>
            </DialogHeader>
            {userCenters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                먼저 센터를 등록해주세요.
              </p>
            ) : (
              <form action={handleCreate} className="space-y-4">
                {error && (
                  <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>소속 센터 *</Label>
                  <Select value={newCenterId} onValueChange={(v) => setNewCenterId(v ?? "")}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="센터 선택">
                        {newCenterId
                          ? userCenters.find((uc) => uc.center_id === newCenterId)?.centers?.name
                          : "센터 선택"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {userCenters.map((uc) => (
                        <SelectItem key={uc.center_id} value={uc.center_id}>
                          {uc.centers?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="내담자 이름"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="010-0000-0000"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">나이</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min={0}
                      max={120}
                      placeholder="만 나이"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gender">성별</Label>
                    <Select name="gender">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="여성">여성</SelectItem>
                        <SelectItem value="남성">남성</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">직업</Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      placeholder="예: 회사원, 학생"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">메모</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="특이사항 메모"
                    className="rounded-xl resize-none"
                    rows={2}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  {loading ? "등록 중..." : "내담자 등록"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 rounded-xl text-base h-11"
          />
        </div>
        <Select value={filterCenter} onValueChange={(v) => setFilterCenter(v ?? "all")}>
          <SelectTrigger className="w-32 sm:w-40 rounded-xl text-base h-11">
            <SelectValue placeholder="전체 센터" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="text-base">전체 센터</SelectItem>
            {userCenters.map((uc) => (
              <SelectItem key={uc.center_id} value={uc.center_id} className="text-base">
                {uc.centers?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-3xl bg-white/70 backdrop-blur-sm p-6 shadow-md">
            <Users className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            {search || filterCenter !== "all"
              ? "검색 결과가 없습니다"
              : "등록된 내담자가 없습니다"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || filterCenter !== "all"
              ? "다른 조건으로 검색해보세요"
              : '"내담자 등록" 버튼으로 첫 내담자를 등록하세요'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:gap-5">
          {filtered.map((client) => {
            const color = getCenterColor(client.center_id);
            const age = calculateAge(client.birth_date);
            const metaParts = [
              age != null ? `${age}세` : null,
              client.gender,
              client.occupation,
            ].filter(Boolean);
            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="rounded-2xl border-0 bg-white/45 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/60 transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-foreground truncate">
                        {client.name}
                        {metaParts.length > 0 && (
                          <span className="ml-2 text-base font-normal text-muted-foreground">
                            {metaParts.join(" · ")}
                          </span>
                        )}
                      </p>
                      <p className="text-base text-muted-foreground mt-0.5">
                        {client.centers?.name}
                        {client.phone && ` · ${client.phone}`}
                      </p>
                    </div>
                    {!client.is_active && (
                      <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        비활성
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(e) => handleEditClick(e, client)}
                      aria-label="수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => handleDelete(e, client.id)}
                      aria-label="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => {
          if (!open) setEditingClient(null);
        }}
      >
        <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>내담자 수정</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form action={handleEdit} className="space-y-4">
              {editError && (
                <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                  {editError}
                </div>
              )}
              <div className="space-y-2">
                <Label>소속 센터 *</Label>
                <Select
                  value={editCenterId}
                  onValueChange={(v) => setEditCenterId(v ?? "")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue>
                      {userCenters.find((uc) => uc.center_id === editCenterId)
                        ?.centers?.name ?? "센터 선택"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {userCenters.map((uc) => (
                      <SelectItem key={uc.center_id} value={uc.center_id}>
                        {uc.centers?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">이름 *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingClient.name}
                  placeholder="내담자 이름"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">전화번호</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={editingClient.phone ?? ""}
                    placeholder="010-0000-0000"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-age">나이</Label>
                  <Input
                    id="edit-age"
                    name="age"
                    type="number"
                    min={0}
                    max={120}
                    defaultValue={calculateAge(editingClient.birth_date) ?? ""}
                    placeholder="만 나이"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">성별</Label>
                  <Select
                    name="gender"
                    defaultValue={editingClient.gender ?? undefined}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="여성">여성</SelectItem>
                      <SelectItem value="남성">남성</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-occupation">직업</Label>
                  <Input
                    id="edit-occupation"
                    name="occupation"
                    defaultValue={editingClient.occupation ?? ""}
                    placeholder="예: 회사원, 학생"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">메모</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingClient.notes ?? ""}
                  placeholder="특이사항 메모"
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <Button
                type="submit"
                disabled={editLoading}
                className="w-full rounded-xl bg-gradient-mint-pink-vivid text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {editLoading ? "수정 중..." : "수정 완료"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
