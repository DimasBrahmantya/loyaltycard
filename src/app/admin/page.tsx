import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Award, Stamp, PlusCircle } from "lucide-react";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("active_tenant")?.value;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  // 1. Total kartu
  let totalCards = 0;
  let readyCards = 0;
  let stampsToday = 0;

  if (activeTenantId) {
    const { count: cardsCount } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", activeTenantId);
    totalCards = cardsCount || 0;

    // 2. Kartu penuh siap tukar
    const { count: completedCount } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", activeTenantId)
      .eq("status", "completed");
    readyCards = completedCount || 0;

    // 3. Stempel hari ini
    const { count: todayCount } = await supabase
      .from("stamps")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", activeTenantId)
      .is("voided_at", null)
      .gte("created_at", todayIso);
    stampsToday = todayCount || 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan Usaha</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aktivitas kartu loyalitas dan stempel pelanggan Anda
          </p>
        </div>
        <div>
          <Link href="/admin/cards/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Buat Kartu Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kartu</CardTitle>
            <CreditCard className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCards}</div>
            <CardDescription className="text-xs mt-1">
              Semua kartu pelanggan terdaftar
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stempel Hari Ini</CardTitle>
            <Stamp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stampsToday}</div>
            <CardDescription className="text-xs mt-1">
              Stempel aktif yang diberikan hari ini
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kartu Siap Tukar</CardTitle>
            <Award className="h-4 w-4 text-orange-600 dark:text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-500">
              {readyCards}
            </div>
            <CardDescription className="text-xs mt-1">
              Kartu penuh yang siap ditukarkan dengan hadiah
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action / Recent Activity placeholder for Agent C/D */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mulai Cepat</CardTitle>
          <CardDescription>
            Kelola kartu pelanggan atau lihat riwayat transaksi stempel
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/cards">
            <Button variant="outline">Lihat Semua Kartu</Button>
          </Link>
          <Link href="/admin/customers">
            <Button variant="outline">Daftar Pelanggan</Button>
          </Link>
          <Link href="/admin/history">
            <Button variant="outline">Riwayat Transaksi</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
