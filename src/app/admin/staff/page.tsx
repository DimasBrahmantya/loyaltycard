import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { StaffManager, type StaffMemberItem } from "./staff-manager";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Manajemen Staff — Admin",
};

export const instant = false;

export default async function StaffPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("active_tenant")?.value;

  let memberQuery = supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id);

  if (activeTenantId) {
    memberQuery = memberQuery.eq("tenant_id", activeTenantId);
  }

  const { data: member } = await memberQuery
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!member?.tenant_id) {
    redirect("/onboarding");
  }

  // Hanya owner yang boleh akses halaman staff
  if (member.role !== "owner") {
    redirect("/admin");
  }

  const tenantId = member.tenant_id;

  // Ambil daftar anggota tenant
  const { data: membersData, error: membersError } = await supabase
    .from("tenant_members")
    .select("user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (membersError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-800 dark:text-red-300">
        Gagal memuat daftar anggota: {membersError.message}
      </div>
    );
  }

  // Ambil data email pengguna via admin client (server-only)
  const userEmailMap = new Map<string, string>();
  if (user.email) {
    userEmailMap.set(user.id, user.email);
  }

  let serviceRoleWarning: string | null = null;
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasServiceRoleKey) {
    try {
      const adminClient = createAdminClient();
      const { data: usersListData, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) {
        serviceRoleWarning = `Gagal memuat email staff: ${listError.message}`;
      } else {
        usersListData?.users?.forEach((u) => {
          if (u.id && u.email) {
            userEmailMap.set(u.id, u.email);
          }
        });
      }
    } catch (err: unknown) {
      serviceRoleWarning =
        err instanceof Error ? err.message : "Gagal menginisialisasi service role client.";
    }
  } else {
    serviceRoleWarning =
      "SUPABASE_SERVICE_ROLE_KEY belum diisi pada file .env.local. Fitur undang staff memerlukan kunci ini.";
  }

  const memberList: StaffMemberItem[] = (membersData || []).map((m) => ({
    userId: m.user_id,
    email: userEmailMap.get(m.user_id) || (m.user_id === user.id && user.email ? user.email : m.user_id),
    role: m.role as "owner" | "staff",
    createdAt: m.created_at,
    isCurrentUser: m.user_id === user.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Manajemen Staff & Anggota
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Undang kasir atau staf baru dan atur akses anggota usaha Anda.
        </p>
      </div>

      {serviceRoleWarning && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Perhatian Konfigurasi Server</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{serviceRoleWarning}</p>
          </div>
        </div>
      )}

      <StaffManager initialMembers={memberList} />
    </div>
  );
}
