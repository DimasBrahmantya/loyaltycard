import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { CustomerCardView } from "./customer-card-view";

export const instant = false;

interface PublicCardPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicCardPageProps): Promise<Metadata> {
  await connection();
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_public_card", { p_token: token });
  const card = data?.[0];

  if (!card) {
    return {
      title: "Kartu Loyalitas",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // R-02: Tidak boleh ada em dash (—)
  return {
    title: `${card.tenant_name}: Kartu Loyalitas Digital`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicCardPage({ params }: PublicCardPageProps) {
  await connection();
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_card", {
    p_token: token,
  });

  const card = data?.[0];

  if (error || !card) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Kartu Tidak Ditemukan
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tautan kartu loyalitas ini tidak valid atau sudah dinonaktifkan. Pastikan kode QR dipindai dengan benar.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 py-8 relative">
      <CustomerCardView card={card} />

      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 pt-6 select-none relative z-10">
        Kartu Loyalitas Digital &bull; {card.tenant_name}
      </footer>
    </main>
  );
}
