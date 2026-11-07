import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, Stamp, Undo2, Gift, ChevronLeft, ChevronRight, User } from "lucide-react";

export const metadata = {
  title: "Riwayat Aktivitas: Admin",
};

export const instant = false;

interface HistoryPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  await connection();
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);

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
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Query total count dan data riwayat transaksi
  const { data: historyRows, count, error } = await supabase
    .from("transaction_history")
    .select("id, card_id, type, at, actor, note", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("at", { ascending: false })
    .range(from, to);

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Batch query data customer untuk setiap kartu di riwayat
  const cardIds = Array.from(
    new Set((historyRows || []).map((r) => r.card_id).filter((id): id is string => Boolean(id)))
  );

  const customerMap = new Map<string, string>();
  if (cardIds.length > 0) {
    const { data: cardsData } = await supabase
      .from("cards")
      .select("id, customers(name)")
      .in("id", cardIds);

    cardsData?.forEach((c) => {
      const customer = Array.isArray(c.customers) ? c.customers[0] : c.customers;
      if (customer?.name) {
        customerMap.set(c.id, customer.name);
      }
    });
  }

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const renderBadge = (type: string | null) => {
    switch (type) {
      case "stamp":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
            <Stamp className="w-3.5 h-3.5" />
            +1 Stempel
          </span>
        );
      case "void":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-200/50 dark:border-red-800/40">
            <Undo2 className="w-3.5 h-3.5" />
            Batal Stempel
          </span>
        );
      case "redeem":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
            <Gift className="w-3.5 h-3.5" />
            Tukar Hadiah
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {type || "Aktivitas"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Riwayat Aktivitas
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Audit trail pemberian stempel, pembatalan, dan klaim reward oleh seluruh kasir
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Log Transaksi
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Total {totalCount} catatan transaksi tersimpan
              </CardDescription>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300">
              Gagal memuat riwayat transaksi: {error.message}
            </div>
          ) : !historyRows || historyRows.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Belum ada riwayat aktivitas
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Setiap stempel yang diberikan atau hadiah yang ditukarkan kasir akan tercatat otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold">
                    <th className="pb-3 px-3">Aktivitas</th>
                    <th className="pb-3 px-3">Pelanggan</th>
                    <th className="pb-3 px-3">Waktu</th>
                    <th className="pb-3 px-3">Catatan Nota</th>
                    <th className="pb-3 px-3 text-right">Kartu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {historyRows.map((item, idx) => {
                    const customerName = item.card_id
                      ? customerMap.get(item.card_id) || "Pelanggan"
                      : "-";

                    return (
                      <tr
                        key={`${item.id || idx}-${item.at}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          {renderBadge(item.type)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{customerName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(item.at)}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {item.note || "-"}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {item.card_id ? (
                            <Link
                              href={`/admin/cards/${item.card_id}`}
                              className="text-xs font-semibold text-blue-900 dark:text-blue-400 hover:underline"
                            >
                              Lihat Detail
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Kontrol Paginasi */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/history?page=${currentPage - 1}`}
                  className="inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 h-11 sm:h-8 px-3 text-slate-900 dark:text-slate-100"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-slate-100 dark:border-slate-800 bg-transparent text-slate-400 dark:text-slate-600 h-11 sm:h-8 px-3 opacity-50 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </span>
              )}

              <span className="text-xs text-slate-500 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={`/admin/history?page=${currentPage + 1}`}
                  className="inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 h-11 sm:h-8 px-3 text-slate-900 dark:text-slate-100"
                >
                  Berikutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-slate-100 dark:border-slate-800 bg-transparent text-slate-400 dark:text-slate-600 h-11 sm:h-8 px-3 opacity-50 cursor-not-allowed">
                  Berikutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
