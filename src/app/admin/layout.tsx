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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 justify-between">
        <div className="space-y-6">
          {/* Store Switcher / Header Card */}
          <Link
            href="/admin"
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 overflow-hidden shadow-sm">
              {tenant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logo_url}
                  alt={tenantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">
                {tenantName}
              </p>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {isOwner ? "Owner" : "Staf"} &bull; Aktif
              </p>
            </div>
          </Link>

          {/* All Sidebar Menu Items */}
          <AdminNavTabs isOwner={isOwner} />
        </div>

        {/* User & Logout Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <p className="px-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {user.email}
          </p>
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a]">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 overflow-hidden">
                {tenant?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logo_url}
                    alt={tenantName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-4 w-4" />
                )}
              </div>
              <span className="truncate">{tenantName}</span>
            </Link>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shrink-0">
              {isOwner ? "Owner" : "Staf"}
            </span>
          </div>

          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </Button>
          </form>
        </div>

        <AdminNavTabs isOwner={isOwner} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 animate-intro-in">
        {children}
      </main>
    </div>
  );
}
