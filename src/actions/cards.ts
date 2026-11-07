"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/types/database";

const createCardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama pelanggan wajib diisi")
    .max(80, "Nama pelanggan maksimal 80 karakter"),
  phone: z
    .string()
    .trim()
    .max(20, "Nomor telepon maksimal 20 karakter")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;

export type CreateCardResult =
  | { success: true; card: Database["public"]["Tables"]["cards"]["Row"] }
  | { success: false; error: string };

export async function createCardAction(
  rawInput: { name: string; phone?: string | null }
): Promise<CreateCardResult> {
  const validated = createCardSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Sesi login telah berakhir. Silakan login kembali.",
    };
  }

  // Ambil tenant aktif
  const cookieStore = await cookies();
  let tenantId = cookieStore.get("active_tenant")?.value;

  if (!tenantId) {
    const { data: member } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!member?.tenant_id) {
      return {
        success: false,
        error: "Tenant usaha tidak ditemukan. Silakan lengkapi onboarding.",
      };
    }
    tenantId = member.tenant_id;
  }

  // Mutasi HANYA lewat RPC create_card
  const { data: newCard, error: rpcError } = await supabase.rpc("create_card", {
    p_tenant: tenantId,
    p_name: validated.data.name,
    p_phone: validated.data.phone || null,
  });

  if (rpcError) {
    if (rpcError.message.includes("tenant_not_found")) {
      return { success: false, error: "Tenant tidak ditemukan." };
    }
    if (rpcError.message.includes("violates check constraint")) {
      return { success: false, error: "Data pelanggan tidak memenuhi validasi database." };
    }
    return { success: false, error: `Gagal membuat kartu: ${rpcError.message}` };
  }

  if (!newCard) {
    return { success: false, error: "Kartu gagal dibuat. Silakan coba kembali." };
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin");

  return { success: true, card: newCard };
}

