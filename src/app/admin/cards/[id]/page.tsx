import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { CardManager, type CardHistoryItem } from "./card-manager";

export const instant = false;

interface CardDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("active_tenant")?.value;

  if (!activeTenantId) {
    redirect("/admin/cards");
  }

  // 1. Ambil detail kartu
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", activeTenantId)
    .maybeSingle();

  if (cardError || !card) {
    notFound();
  }

  // 2. Ambil data pelanggan & tenant
  const [customerRes, tenantRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, phone")
      .eq("id", card.customer_id)
      .maybeSingle(),
    supabase
      .from("tenants")
      .select("id, name, logo_url, brand_color, reward_text, card_bg_url, stamp_icon_url, stamp_color, stamp_has_border")
      .eq("id", card.tenant_id)
      .maybeSingle(),
  ]);

  if (!customerRes.data || !tenantRes.data) {
    notFound();
  }

  // 3. Cari stempel terakhir siklus berjalan yang belum dibatalkan
  const { data: lastStamp } = await supabase
    .from("stamps")
    .select("id")
    .eq("card_id", card.id)
    .eq("cycle", card.current_cycle)
    .is("voided_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 4. Ambil riwayat mutasi kartu dari view transaction_history
  const { data: historyData } = await supabase
    .from("transaction_history")
    .select("id, type, at, actor, note")
    .eq("card_id", card.id)
    .order("at", { ascending: false })
    .limit(50);

  const history: CardHistoryItem[] = (historyData || []).map((h) => ({
    id: h.id,
    type: h.type,
    at: h.at,
    actor: h.actor,
    note: h.note,
  }));

  return (
    <div className="py-2">
      <CardManager
        initialCard={card}
        customer={customerRes.data}
        tenant={tenantRes.data}
        lastStampId={lastStamp?.id || null}
        initialHistory={history}
      />
    </div>
  );
}

