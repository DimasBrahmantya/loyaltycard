"use server";

import { createClient } from "@/lib/supabase/server";
import { createTenantSchema } from "@/lib/validators/tenant";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createTenantAction(prevState: unknown, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
  };

  const validated = createTenantSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const { data: userAuth, error: authError } = await supabase.auth.getUser();

  if (authError || !userAuth.user) {
    redirect("/login");
  }

  // Panggil RPC create_tenant(p_name, p_slug)
  const { data: tenantId, error: rpcError } = await supabase.rpc("create_tenant", {
    p_name: validated.data.name,
    p_slug: validated.data.slug,
  });

  if (rpcError) {
    if (rpcError.message.includes("duplicate") || rpcError.message.includes("slug")) {
      return { error: "Slug usaha sudah digunakan. Silakan pilih slug lain." };
    }
    return { error: `Gagal membuat usaha: ${rpcError.message}` };
  }

  if (!tenantId) {
    return { error: "Gagal membuat tenant, silakan coba lagi" };
  }

  const cookieStore = await cookies();
  cookieStore.set("active_tenant", tenantId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  redirect("/admin");
}

