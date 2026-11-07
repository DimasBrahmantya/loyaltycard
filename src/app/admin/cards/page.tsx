import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard } from "lucide-react";
import { CardsView, type CardItem } from "./cards-view";

export const instant = false;

export default async function AdminCardsPage() {
  await connection();
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("active_tenant")?.value;

  let cards: CardItem[] = [];

  if (activeTenantId) {
    const { data } = await supabase
      .from("cards")
      .select(
        `
        id,
        public_token,
        stamps_count,
        stamps_required,
        current_cycle,
        status,
        completed_at,
        created_at,
        customer_id,
        customers (
          name,
          phone
        )
      `
      )
      .eq("tenant_id", activeTenantId)
      .order("created_at", { ascending: false });

    if (data) {
      cards = data.map((item) => ({
        id: item.id,
        public_token: item.public_token,
        stamps_count: item.stamps_count,
        stamps_required: item.stamps_required,
        current_cycle: item.current_cycle,
        status: item.status,
        completed_at: item.completed_at,
        created_at: item.created_at,
        customer: Array.isArray(item.customers)
          ? item.customers[0] || null
          : item.customers || null,
      }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-600" />
            Kartu Pelanggan
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola kartu loyalitas, stempel, dan penukaran hadiah pelanggan.
          </p>
        </div>

        <Link href="/admin/cards/new">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto shadow-sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Buat Kartu Baru
          </Button>
        </Link>
      </div>

      <CardsView initialCards={cards} />
    </div>
  );
}

