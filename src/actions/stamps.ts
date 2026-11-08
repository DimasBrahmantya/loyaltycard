"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/types/database";

const addStampSchema = z.object({
  cardId: z.string().uuid("ID kartu tidak valid"),
  note: z
    .string()
    .trim()
    .max(255, "Catatan maksimal 255 karakter")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

const voidStampSchema = z.object({
  stampId: z.string().uuid("ID stempel tidak valid"),
});

const redeemCardSchema = z.object({
  cardId: z.string().uuid("ID kartu tidak valid"),
});

const scanAndStampSchema = z.object({
  qrContent: z.string().min(1, "Data QR code tidak boleh kosong"),
  note: z
    .string()
    .trim()
    .max(255, "Catatan maksimal 255 karakter")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type ScanAndStampResult =
  | {
      success: true;
      card: Database["public"]["Tables"]["cards"]["Row"];
      customerName: string;
      isCompleted: boolean;
      stampsCount: number;
      stampsRequired: number;
    }
  | {
      success: false;
      error: string;
      cardId?: string;
      customerName?: string;
      isCompleted?: boolean;
    };

export type StampActionResult =
  | { success: true; card: Database["public"]["Tables"]["cards"]["Row"] }
  | { success: false; error: string };

export async function addStampAction(rawInput: {
  cardId: string;
  note?: string | null;
}): Promise<StampActionResult> {
  const validated = addStampSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sesi login telah berakhir. Silakan login kembali.",
    };
  }

  // Mutasi HANYA lewat RPC add_stamp
  const { data: updatedCard, error: rpcError } = await supabase.rpc("add_stamp", {
    p_card: validated.data.cardId,
    p_note: validated.data.note || null,
  });

  if (rpcError) {
    if (rpcError.message.includes("card_full")) {
      return {
        success: false,
        error: "Kartu sudah penuh! Silakan tukar hadiah untuk pelanggan.",
      };
    }
    if (rpcError.message.includes("forbidden")) {
      return { success: false, error: "Akses ditolak untuk usaha ini." };
    }
    return { success: false, error: `Gagal menambah stempel: ${rpcError.message}` };
  }

  if (!updatedCard) {
    return { success: false, error: "Gagal memperbarui kartu stempel." };
  }

  revalidatePath(`/admin/cards/${validated.data.cardId}`);
  revalidatePath("/admin/cards");
  revalidatePath("/admin");

  return { success: true, card: updatedCard };
}

export async function voidStampAction(rawInput: {
  stampId: string;
}): Promise<StampActionResult> {
  const validated = voidStampSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sesi login telah berakhir. Silakan login kembali.",
    };
  }

  // Mutasi HANYA lewat RPC void_stamp
  const { data: updatedCard, error: rpcError } = await supabase.rpc("void_stamp", {
    p_stamp: validated.data.stampId,
  });

  if (rpcError) {
    if (rpcError.message.includes("old_cycle")) {
      return {
        success: false,
        error: "Hanya stempel pada siklus berjalan yang dapat dibatalkan.",
      };
    }
    if (rpcError.message.includes("already_voided")) {
      return {
        success: false,
        error: "Stempel ini sudah pernah dibatalkan sebelumnya.",
      };
    }
    if (rpcError.message.includes("not_found")) {
      return { success: false, error: "Stempel tidak ditemukan." };
    }
    if (rpcError.message.includes("forbidden")) {
      return { success: false, error: "Akses ditolak untuk usaha ini." };
    }
    return { success: false, error: `Gagal membatalkan stempel: ${rpcError.message}` };
  }

  if (!updatedCard) {
    return { success: false, error: "Gagal membatalkan stempel." };
  }

  revalidatePath(`/admin/cards/${updatedCard.id}`);
  revalidatePath("/admin/cards");
  revalidatePath("/admin");

  return { success: true, card: updatedCard };
}

export async function redeemCardAction(rawInput: {
  cardId: string;
}): Promise<StampActionResult> {
  const validated = redeemCardSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sesi login telah berakhir. Silakan login kembali.",
    };
  }

  // Mutasi HANYA lewat RPC redeem_card
  const { data: updatedCard, error: rpcError } = await supabase.rpc("redeem_card", {
    p_card: validated.data.cardId,
  });

  if (rpcError) {
    if (rpcError.message.includes("not_completed")) {
      return {
        success: false,
        error: "Kartu belum penuh, hadiah belum dapat ditukar.",
      };
    }
    if (rpcError.message.includes("forbidden")) {
      return { success: false, error: "Akses ditolak untuk usaha ini." };
    }
    return { success: false, error: `Gagal menukar hadiah: ${rpcError.message}` };
  }

  if (!updatedCard) {
    return { success: false, error: "Gagal memproses penukaran hadiah." };
  }

  revalidatePath(`/admin/cards/${validated.data.cardId}`);
  revalidatePath("/admin/cards");
  revalidatePath("/admin");

  return { success: true, card: updatedCard };
}

function extractTokenFromQr(content: string): string {
  const trimmed = content.trim();
  // Cocokkan URL seperti /c/TOKEN atau https://.../c/TOKEN
  const urlMatch = trimmed.match(/\/c\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  const queryMatch = trimmed.match(/[?&]token=([a-zA-Z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }
  return trimmed;
}

export async function scanAndStampAction(rawInput: {
  qrContent: string;
  note?: string | null;
}): Promise<ScanAndStampResult> {
  const validated = scanAndStampSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Data QR tidak valid",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Harus login kasir terlebih dahulu untuk memproses stempel.",
    };
  }

  const token = extractTokenFromQr(validated.data.qrContent);

  // Cari kartu berdasarkan public_token (RLS membatasi hanya untuk member tenant yang login)
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, tenant_id, stamps_count, stamps_required, status, current_cycle, public_token, customers(name)")
    .eq("public_token", token)
    .maybeSingle();

  if (cardError || !card) {
    return {
      success: false,
      error: "Kartu tidak ditemukan atau QR code tidak terdaftar di usaha Anda.",
    };
  }

  const customer = Array.isArray(card.customers) ? card.customers[0] : card.customers;
  const customerName = customer?.name || "Pelanggan";

  if (card.status === "completed" || card.stamps_count >= card.stamps_required) {
    return {
      success: false,
      error: `Kartu ${customerName} sudah penuh (${card.stamps_count}/${card.stamps_required})! Silakan tukar hadiah.`,
      cardId: card.id,
      customerName,
      isCompleted: true,
    };
  }

  const { data: updatedCard, error: rpcError } = await supabase.rpc("add_stamp", {
    p_card: card.id,
    p_note: validated.data.note || "Scan QR Kasir",
  });

  if (rpcError) {
    if (rpcError.message.includes("card_full")) {
      return {
        success: false,
        error: `Kartu ${customerName} sudah penuh! Silakan tukar hadiah.`,
        cardId: card.id,
        customerName,
        isCompleted: true,
      };
    }
    if (rpcError.message.includes("forbidden")) {
      return {
        success: false,
        error: "Akses ditolak. Anda bukan kasir/staf resmi untuk usaha ini.",
      };
    }
    return {
      success: false,
      error: `Gagal menambah stempel: ${rpcError.message}`,
    };
  }

  if (!updatedCard) {
    return { success: false, error: "Gagal memperbarui kartu stempel." };
  }

  revalidatePath(`/admin/cards/${card.id}`);
  revalidatePath("/admin/cards");
  revalidatePath("/admin");
  revalidatePath("/admin/history");
  revalidatePath(`/c/${card.public_token}`);

  const isCompleted = updatedCard.stamps_count >= updatedCard.stamps_required;

  return {
    success: true,
    card: updatedCard,
    customerName,
    isCompleted,
    stampsCount: updatedCard.stamps_count,
    stampsRequired: updatedCard.stamps_required,
  };
}


