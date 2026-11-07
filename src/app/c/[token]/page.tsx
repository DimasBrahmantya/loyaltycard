import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import { LoyaltyCard } from "@/components/loyalty-card";
import type { Metadata } from "next";
import { Award, AlertCircle } from "lucide-react";

// Next.js 16 with cacheComponents is dynamic by default
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

  return {
    title: `${card.tenant_name} — Kartu Loyalitas`,
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
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto mb-4 text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white mb-2">
            Kartu Tidak Ditemukan
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Link kartu loyalitas tidak valid atau sudah tidak aktif. Pastikan kode QR dipindai dengan benar.
          </p>
        </div>
      </main>
    );
  }

  const redeemedCount = Number(card.rewards_redeemed) || 0;

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-[420px] flex flex-col items-center gap-4">
        {/* Kartu Loyalitas Read-Only */}
        <LoyaltyCard
          tenantName={card.tenant_name}
          logoUrl={card.logo_url}
          brandColor={card.brand_color}
          customerName={card.customer_name}
          stampsCount={card.stamps_count}
          stampsRequired={card.stamps_required}
          rewardText={card.reward_text}
          status={card.status}
        />

        {/* Info Hadiah yang Sudah Ditukar */}
        {redeemedCount > 0 && (
          <div className="w-full rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3.5 flex items-center justify-center gap-2 text-sm text-amber-300/90">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hadiah sudah ditukar: {redeemedCount} kali</span>
          </div>
        )}

        <footer className="text-center text-xs text-zinc-500 pt-2 select-none">
          Kartu Loyalitas Digital &bull; Ditampilkan oleh {card.tenant_name}
        </footer>
      </div>
    </main>
  );
}

