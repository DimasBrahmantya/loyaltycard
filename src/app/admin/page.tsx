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
import { CreditCard, Award, Stamp, PlusCircle, Users, History } from "lucide-react";

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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Ringkasan Usaha
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Aktivitas kartu loyalitas dan stempel pelanggan secara langsung
          </p>
        </div>
        <div>
          <Link href="/admin/cards/new">
            <Button className="gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs">
              <PlusCircle className="h-4 w-4" />
              <span>Buat Kartu Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Total Kartu
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              {totalCards}
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Seluruh kartu pelanggan yang terdaftar
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Stempel Hari Ini
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-900/10 flex items-center justify-center text-blue-900 dark:text-blue-400">
              <Stamp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              {stampsToday}
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Stempel aktif yang diberikan hari ini
            </CardDescription>
          </CardContent>
        </Card>

        <Card className={`border transition ${
          readyCards > 0
            ? "border-blue-900/30 dark:border-blue-700/40 bg-blue-900/[0.03]"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Kartu Siap Tukar Hadiah
            </CardTitle>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              readyCards > 0
                ? "bg-blue-900/10 text-blue-900 dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}>
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl sm:text-3xl font-extrabold ${
              readyCards > 0 ? "text-blue-900 dark:text-blue-300" : "text-slate-900 dark:text-slate-50"
            }`}>
              {readyCards}
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {readyCards > 0
                ? "Terdapat pelanggan dengan stempel penuh yang siap klaim hadiah!"
                : "Belum ada kartu yang siap ditukar saat ini."}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Panel */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Akses Menu Cepat
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Pintasan cepat untuk kelola kartu pelanggan, data pembeli, atau riwayat audit kasir
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/cards"
            className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-blue-900 dark:text-blue-400" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Kelola Kartu
              </div>
            </div>
          </Link>

          <Link
            href="/admin/customers"
            className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-900 dark:text-blue-400" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Data Pelanggan
              </div>
            </div>
          </Link>

          <Link
            href="/admin/history"
            className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-blue-900 dark:text-blue-400" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Riwayat Transaksi
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
