import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, Stamp, Undo2, Gift, ChevronLeft, ChevronRight, User } from "lucide-react";

export const metadata = {
  title: "Riwayat Aktivitas — Admin",
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Stamp className="w-3.5 h-3.5" />
            +1 Stempel
          </span>
        );
      case "void":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            <Undo2 className="w-3.5 h-3.5" />
            Batal Stempel
          </span>
        );
      case "redeem":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Gift className="w-3.5 h-3.5" />
            Tukar Hadiah
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
            {type || "Aktivitas"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Riwayat Aktivitas
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Semua transaksi pemberian stempel, pembatalan, dan penukaran hadiah.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Log Transaksi</CardTitle>
              <CardDescription>
                Total {totalCount} aktivitas tercatat
              </CardDescription>
            </div>
            <div className="text-xs text-zinc-500">
              Halaman {currentPage} dari {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-800 dark:text-red-300">
              Gagal memuat riwayat transaksi: {error.message}
            </div>
          ) : !historyRows || historyRows.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Belum ada riwayat aktivitas
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Setiap stempel yang diberikan atau hadiah yang ditukar akan tercatat otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs font-semibold">
                    <th className="pb-3 px-2">Aktivitas</th>
                    <th className="pb-3 px-2">Pelanggan</th>
                    <th className="pb-3 px-2">Waktu</th>
                    <th className="pb-3 px-2">Catatan</th>
                    <th className="pb-3 px-2 text-right">Kartu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {historyRows.map((item, idx) => {
                    const customerName = item.card_id
                      ? customerMap.get(item.card_id) || "Pelanggan"
                      : "-";

                    return (
                      <tr
                        key={`${item.id || idx}-${item.at}`}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="py-3 px-2 whitespace-nowrap">
                          {renderBadge(item.type)}
                        </td>
                        <td className="py-3 px-2 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{customerName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(item.at)}
                        </td>
                        <td className="py-3 px-2 text-xs text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                          {item.note || "-"}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          {item.card_id ? (
                            <Link
                              href={`/admin/cards/${item.card_id}`}
                              className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 underline underline-offset-2"
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
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/history?page=${currentPage - 1}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 h-8 px-3 text-zinc-900 dark:text-zinc-100"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-400 dark:text-zinc-600 h-8 px-3 opacity-50 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </span>
              )}

              <span className="text-xs text-zinc-500">
                Halaman {currentPage} dari {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={`/admin/history?page=${currentPage + 1}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 h-8 px-3 text-zinc-900 dark:text-zinc-100"
                >
                  Berikutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-400 dark:text-zinc-600 h-8 px-3 opacity-50 cursor-not-allowed">
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
