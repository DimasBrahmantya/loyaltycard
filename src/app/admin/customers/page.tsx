import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CustomersView, type CustomerItem } from "./customers-view";

export const metadata = {
  title: "Data Pelanggan: Admin",
};

export const instant = false;

export default async function CustomersPage() {
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
    .select("tenant_id")
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

  const tenantId = member.tenant_id;

  // Query customers dan kartu aktif mereka
  const { data: customersData, error } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      phone,
      created_at,
      cards (
        id,
        stamps_count,
        stamps_required,
        status,
        public_token
      )
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-800 dark:text-red-300">
        Gagal memuat daftar pelanggan: {error.message}
      </div>
    );
  }

  const customers: CustomerItem[] = (customersData || []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    created_at: c.created_at,
    cards: Array.isArray(c.cards) ? c.cards : c.cards ? [c.cards] : [],
  }));

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Data Pelanggan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Daftar seluruh pelanggan dan ringkasan status kartu loyalitas mereka
        </p>
      </div>

      <CustomersView initialCustomers={customers} />
    </div>
  );
}
