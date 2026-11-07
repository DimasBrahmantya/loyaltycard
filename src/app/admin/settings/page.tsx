import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Pengaturan Usaha — Admin",
};

export const instant = false;

export default async function SettingsPage() {
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

  // Hanya owner yang boleh akses pengaturan
  if (member.role !== "owner") {
    redirect("/admin");
  }

  // Ambil detail tenant
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url, brand_color, reward_text, stamps_required")
    .eq("id", member.tenant_id)
    .single();

  if (error || !tenant) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-800 dark:text-red-300">
        Gagal memuat data usaha. Silakan refresh halaman.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Pengaturan Usaha
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kelola informasi nama usaha, logo, warna identitas, dan jumlah stempel.
        </p>
      </div>

      <SettingsForm tenant={tenant} />
    </div>
  );
}

