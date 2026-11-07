"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inviteStaffAction, removeStaffAction } from "@/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Mail, UserPlus, Trash2, Shield, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export interface StaffMemberItem {
  userId: string;
  email: string;
  role: "owner" | "staff";
  createdAt: string;
  isCurrentUser: boolean;
}

interface StaffManagerProps {
  initialMembers: StaffMemberItem[];
}

export function StaffManager({ initialMembers }: StaffManagerProps) {
  const [members, setMembers] = useState<StaffMemberItem[]>(initialMembers);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const onInvite = async (data: InviteFormData) => {
    setActionSuccess(null);
    setActionError(null);

    const res = await inviteStaffAction({ email: data.email });
    if (res.success) {
      setActionSuccess(res.message || `Staff dengan email ${data.email} berhasil diundang.`);
      reset();
      // Reload halaman untuk mendapatkan data terbaru
      window.location.reload();
    } else {
      setActionError(res.error);
    }
  };

  const handleRemove = async (userId: string, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akses ${email} dari usaha ini?`)) {
      return;
    }

    setRemovingId(userId);
    setActionSuccess(null);
    setActionError(null);

    const res = await removeStaffAction({ userId });
    if (res.success) {
      setActionSuccess(res.message || "Anggota berhasil dihapus.");
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } else {
      setActionError(res.error);
    }
    setRemovingId(null);
  };

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(isoString));
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Form Undang Staff */}
      <Card>
        <CardHeader>
          <CardTitle>Undang Anggota / Kasir Baru</CardTitle>
          <CardDescription>
            Kirimkan undangan ke email staf. Staf dapat membuat kartu, memberi stempel, dan melayani penukaran hadiah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onInvite)} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Staf</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="kasir@contoh.com"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim Undangan...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Undang Staf
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Daftar Anggota */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota Usaha</CardTitle>
          <CardDescription>
            Seluruh pemilik dan staf yang memiliki akses ke dashboard usaha ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs font-semibold">
                  <th className="pb-3 px-2">Pengguna</th>
                  <th className="pb-3 px-2">Peran</th>
                  <th className="pb-3 px-2">Tanggal Bergabung</th>
                  <th className="pb-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {members.map((member) => (
                  <tr
                    key={member.userId}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {member.email}
                        </span>
                        {member.isCurrentUser && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-normal">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          member.role === "owner"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {member.role === "owner" ? (
                          <>
                            <Shield className="w-3 h-3" />
                            Owner
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Staff
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-zinc-500 whitespace-nowrap">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          removingId === member.userId ||
                          (member.isCurrentUser && member.role === "owner" && members.filter((m) => m.role === "owner").length <= 1)
                        }
                        onClick={() => handleRemove(member.userId, member.email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 h-8 px-2"
                      >
                        {removingId === member.userId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Hapus
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

