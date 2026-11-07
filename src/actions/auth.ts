"use server";

import { createClient } from "@/lib/supabase/server";
import { authSchema } from "@/lib/validators/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(prevState: unknown, formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = authSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email atau kata sandi salah"
          : error.message,
    };
  }

  if (!data.user) {
    return { error: "Gagal masuk, silakan coba lagi" };
  }

  // Cek apakah user memiliki tenant
  const { data: member } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const cookieStore = await cookies();
  if (member?.tenant_id) {
    cookieStore.set("active_tenant", member.tenant_id, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    redirect("/admin");
  } else {
    redirect("/onboarding");
  }
}

export async function registerAction(prevState: unknown, formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = authSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return {
    success: true,
    message: "Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi atau masuk.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete("active_tenant");

  redirect("/login");
}

