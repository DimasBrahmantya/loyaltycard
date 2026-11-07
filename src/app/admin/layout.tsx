import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { AdminNavTabs } from "./nav-tabs";
import {
  LogOut,
  Store,
} from "lucide-react";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Query tenant membership
  let memberQuery = supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(id, name, logo_url, brand_color)")
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

  // Next.js Supabase join returns single object or array
  const tenant = Array.isArray(member.tenants) ? member.tenants[0] : member.tenants;
  const tenantName = tenant?.name || "Usaha";
  const isOwner = member.role === "owner";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a]">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-900/10 border border-blue-900/20 flex items-center justify-center text-blue-900 dark:text-blue-400 group-hover:scale-105 transition-transform">
                {tenant?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logo_url}
                    alt={tenantName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Store className="h-4 w-4" />
                )}
              </div>
              <span className="truncate max-w-[150px] sm:max-w-xs">{tenantName}</span>
            </Link>

            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                isOwner
                  ? "bg-blue-900/10 text-blue-900 border-blue-900/20 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {isOwner ? "Owner" : "Staf"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 font-medium">
              {user.email}
            </span>
            <form action={logoutAction}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Client Navigation Tabs with Active Highlighting */}
        <AdminNavTabs isOwner={isOwner} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 animate-intro-in">
        {children}
      </main>
    </div>
  );
}
