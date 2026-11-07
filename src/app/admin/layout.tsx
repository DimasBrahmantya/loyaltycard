import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Users,
  History,
  Settings,
  UserCheck,
  LayoutDashboard,
  LogOut,
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

  const navLinks = [
    { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/admin/cards", label: "Kartu", icon: CreditCard },
    { href: "/admin/customers", label: "Pelanggan", icon: Users },
    { href: "/admin/history", label: "Riwayat", icon: History },
    ...(isOwner
      ? [
          { href: "/admin/settings", label: "Pengaturan", icon: Settings },
          { href: "/admin/staff", label: "Staff", icon: UserCheck },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-bold text-lg text-orange-600 dark:text-orange-500"
            >
              <CreditCard className="h-6 w-6" />
              <span>{tenantName}</span>
            </Link>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isOwner
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {isOwner ? "Owner" : "Staff"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </span>
            <form action={logoutAction}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          aria-label="Navigasi Admin"
          className="max-w-6xl mx-auto flex items-center space-x-1 px-4 sm:px-6 overflow-x-auto border-t border-zinc-100 dark:border-zinc-800/50 py-1"
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 whitespace-nowrap"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
