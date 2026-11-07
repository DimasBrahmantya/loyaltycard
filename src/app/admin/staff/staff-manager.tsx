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
      setActionSuccess(res.message || `Staf dengan email ${data.email} berhasil diundang.`);
      reset();
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
      setActionSuccess(res.message || "Anggota staf berhasil dihapus.");
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
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-intro-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-800 dark:text-red-300 animate-intro-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Form Undang Staff */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Undang Anggota Kasir Baru
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Kirimkan undangan ke email staf. Staf dapat membuat kartu, memberi stempel, dan melayani penukaran hadiah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onInvite)} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Staf Kasir
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="kasir@usaha.com"
                  className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-10"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs h-11 px-5"
            >
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
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Daftar Anggota Usaha
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Seluruh pemilik dan staf yang memiliki akses ke dashboard operasional usaha ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold">
                  <th className="pb-3 px-3">Pengguna</th>
                  <th className="pb-3 px-3">Peran Akses</th>
                  <th className="pb-3 px-3">Tanggal Bergabung</th>
                  <th className="pb-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {members.map((member) => (
                  <tr
                    key={member.userId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {member.email}
                        </span>
                        {member.isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                          member.role === "owner"
                            ? "bg-blue-900/10 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-900/20"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {member.role === "owner" ? (
                          <>
                            <Shield className="w-3 h-3 text-blue-900 dark:text-blue-400" />
                            Owner
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                            Staff
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          removingId === member.userId ||
                          (member.isCurrentUser && member.role === "owner" && members.filter((m) => m.role === "owner").length <= 1)
                        }
                        onClick={() => handleRemove(member.userId, member.email)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs h-9 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        {removingId === member.userId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
