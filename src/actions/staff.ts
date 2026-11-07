"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inviteStaffSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Alamat email tidak valid"),
});

const removeStaffSchema = z.object({
  userId: z.string().uuid("ID pengguna tidak valid"),
});

export type ActionResponse =
  | { success: true; message?: string }
  | { success: false; error: string };

async function getActiveTenantOwner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Sesi login telah berakhir. Silakan login kembali.");
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
      throw new Error("Tenant usaha tidak ditemukan.");
    }
    tenantId = member.tenant_id;
  }

  // Cek apakah user adalah owner
  const { data: ownerMember, error: ownerError } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerError || !ownerMember) {
    throw new Error("Hanya pemilik (owner) yang memiliki akses manajemen staff.");
  }

  return { user, tenantId };
}

export async function inviteStaffAction(rawInput: {
  email: string;
}): Promise<ActionResponse> {
  const validated = inviteStaffSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Input email tidak valid.",
    };
  }

  try {
    const supabase = await createClient();
    const { tenantId } = await getActiveTenantOwner(supabase);

    const adminClient = createAdminClient();
    const email = validated.data.email;

    // 1. Coba undang user via auth admin
    let invitedUserId: string | null = null;
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email);

    if (inviteData?.user) {
      invitedUserId = inviteData.user.id;
    } else if (inviteError) {
      // Jika user sudah terdaftar di auth, cari user berdasarkan email
      const { data: userListData, error: listError } =
        await adminClient.auth.admin.listUsers();

      if (listError) {
        return {
          success: false,
          error: `Gagal mencari data user: ${listError.message}`,
        };
      }

      const existingUser = userListData.users.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (!existingUser) {
        return {
          success: false,
          error: `Gagal mengundang staff: ${inviteError.message}`,
        };
      }

      invitedUserId = existingUser.id;
    }

    if (!invitedUserId) {
      return {
        success: false,
        error: "Gagal memproses akun pengguna.",
      };
    }

    // 2. Cek apakah user sudah terdaftar sebagai anggota tenant
    const { data: existingMember } = await adminClient
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", invitedUserId)
      .maybeSingle();

    if (existingMember) {
      return {
        success: false,
        error: `Pengguna dengan email ${email} sudah menjadi anggota usaha (${existingMember.role}).`,
      };
    }

    // 3. Masukkan ke tenant_members sebagai staff menggunakan service role
    const { error: insertError } = await adminClient
      .from("tenant_members")
      .insert({
        tenant_id: tenantId,
        user_id: invitedUserId,
        role: "staff",
      });

    if (insertError) {
      return {
        success: false,
        error: `Gagal menambahkan staff ke usaha: ${insertError.message}`,
      };
    }

    revalidatePath("/admin/staff");
    return { success: true, message: `Staff dengan email ${email} berhasil diundang.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return { success: false, error: errorMsg };
  }
}

export async function removeStaffAction(rawInput: {
  userId: string;
}): Promise<ActionResponse> {
  const validated = removeStaffSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "ID pengguna tidak valid.",
    };
  }

  try {
    const supabase = await createClient();
    const { user: currentUser, tenantId } = await getActiveTenantOwner(supabase);

    const targetUserId = validated.data.userId;

    // Jika target adalah diri sendiri
    if (targetUserId === currentUser.id) {
      // Cek jumlah owner
      const { data: owners, error: countError } = await supabase
        .from("tenant_members")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .eq("role", "owner");

      if (countError || !owners || owners.length <= 1) {
        return {
          success: false,
          error: "Tidak dapat menghapus diri sendiri karena Anda adalah satu-satunya pemilik (owner).",
        };
      }
    }

    const adminClient = createAdminClient();

    // Hapus dari tenant_members
    const { error: deleteError } = await adminClient
      .from("tenant_members")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      return {
        success: false,
        error: `Gagal menghapus anggota: ${deleteError.message}`,
      };
    }

    revalidatePath("/admin/staff");
    return { success: true, message: "Anggota berhasil dihapus." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return { success: false, error: errorMsg };
  }
}

