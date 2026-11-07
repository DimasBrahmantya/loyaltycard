"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama usaha minimal 2 karakter")
    .max(80, "Nama usaha maksimal 80 karakter"),
  brand_color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format warna tidak valid (contoh: #c2410c)"),
  reward_text: z
    .string()
    .trim()
    .min(1, "Hadiah tidak boleh kosong")
    .max(100, "Hadiah maksimal 100 karakter"),
  stamps_required: z
    .coerce
    .number()
    .int()
    .min(3, "Minimal 3 stempel")
    .max(20, "Maksimal 20 stempel"),
  logo_url: z
    .string()
    .url("URL logo tidak valid")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  card_bg_url: z
    .string()
    .url("URL latar kartu tidak valid")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  stamp_icon_url: z
    .string()
    .url("URL ikon stempel tidak valid")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  stamp_color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format warna stempel harus hex 6 digit (contoh: #ffffff)")
    .default("#ffffff"),
  stamp_has_border: z
    .boolean()
    .default(true),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export type ActionResponse =
  | { success: true; message?: string }
  | { success: false; error: string };

export async function updateTenantAction(
  rawInput: UpdateTenantInput
): Promise<ActionResponse> {
  const validated = updateTenantSchema.safeParse(rawInput);
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
        error: "Tenant usaha tidak ditemukan.",
      };
    }
    tenantId = member.tenant_id;
  }

  // Pastikan user adalah owner dari tenant
  const { data: ownerMember, error: ownerCheckError } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerCheckError || !ownerMember) {
    return {
      success: false,
      error: "Hanya pemilik (owner) yang memiliki akses mengubah pengaturan usaha.",
    };
  }

  // Update data tenant
  const { error: updateError } = await supabase
    .from("tenants")
    .update({
      name: validated.data.name,
      brand_color: validated.data.brand_color,
      reward_text: validated.data.reward_text,
      stamps_required: validated.data.stamps_required,
      logo_url: validated.data.logo_url ?? null,
      card_bg_url: validated.data.card_bg_url ?? null,
      stamp_icon_url: validated.data.stamp_icon_url ?? null,
      stamp_color: validated.data.stamp_color ?? "#ffffff",
      stamp_has_border: validated.data.stamp_has_border ?? true,
    })
    .eq("id", tenantId);

  if (updateError) {
    return {
      success: false,
      error: `Gagal memperbarui pengaturan: ${updateError.message}`,
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/admin/cards");

  return { success: true, message: "Pengaturan usaha berhasil disimpan." };
}

export async function uploadLogoAction(
  formData: FormData
): Promise<{ success: true; publicUrl: string } | { success: false; error: string }> {
  const file = formData.get("logo") as File | null;
  if (!file) {
    return { success: false, error: "File gambar tidak ditemukan." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Sesi login telah berakhir. Silakan login kembali." };
  }

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
      return { success: false, error: "Tenant usaha tidak ditemukan." };
    }
    tenantId = member.tenant_id;
  }

  // Cek apakah user adalah owner
  const { data: ownerMember } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (!ownerMember) {
    return { success: false, error: "Hanya pemilik (owner) yang dapat mengunggah logo usaha." };
  }

  const filePath = `${tenantId}/logo.png`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const adminClient = createAdminClient();
      const { error: adminUploadError } = await adminClient.storage
        .from("logos")
        .upload(filePath, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (adminUploadError) {
        return { success: false, error: `Gagal mengunggah logo: ${adminUploadError.message}` };
      }
    } else {
      return { success: false, error: `Gagal mengunggah logo: ${uploadError.message}` };
    }
  }

  const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  return { success: true, publicUrl };
}

export async function uploadCardBgAction(
  formData: FormData
): Promise<{ success: true; publicUrl: string } | { success: false; error: string }> {
  const file = formData.get("card_bg") as File | null;
  if (!file) {
    return { success: false, error: "File gambar latar tidak ditemukan." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Sesi login telah berakhir. Silakan login kembali." };
  }

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
      return { success: false, error: "Tenant usaha tidak ditemukan." };
    }
    tenantId = member.tenant_id;
  }

  const { data: ownerMember } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (!ownerMember) {
    return { success: false, error: "Hanya pemilik (owner) yang dapat mengunggah latar kartu." };
  }

  const filePath = `${tenantId}/card_bg.png`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const adminClient = createAdminClient();
      const { error: adminUploadError } = await adminClient.storage
        .from("logos")
        .upload(filePath, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (adminUploadError) {
        return { success: false, error: `Gagal mengunggah latar: ${adminUploadError.message}` };
      }
    } else {
      return { success: false, error: `Gagal mengunggah latar: ${uploadError.message}` };
    }
  }

  const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  return { success: true, publicUrl };
}

export async function uploadStampIconAction(
  formData: FormData
): Promise<{ success: true; publicUrl: string } | { success: false; error: string }> {
  const file = formData.get("stamp_icon") as File | null;
  if (!file) {
    return { success: false, error: "File ikon stempel tidak ditemukan." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Sesi login telah berakhir. Silakan login kembali." };
  }

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
      return { success: false, error: "Tenant usaha tidak ditemukan." };
    }
    tenantId = member.tenant_id;
  }

  const { data: ownerMember } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (!ownerMember) {
    return { success: false, error: "Hanya pemilik (owner) yang dapat mengunggah ikon stempel." };
  }

  const filePath = `${tenantId}/stamp_icon.png`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const adminClient = createAdminClient();
      const { error: adminUploadError } = await adminClient.storage
        .from("logos")
        .upload(filePath, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (adminUploadError) {
        return { success: false, error: `Gagal mengunggah ikon: ${adminUploadError.message}` };
      }
    } else {
      return { success: false, error: `Gagal mengunggah ikon: ${uploadError.message}` };
    }
  }

  const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  return { success: true, publicUrl };
}

