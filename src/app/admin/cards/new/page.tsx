import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { NewCardForm } from "./new-card-form";

export const instant = false;

export default async function NewCardPage() {
  await connection();
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("active_tenant")?.value;

  if (!activeTenantId) {
    redirect("/admin/cards");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", activeTenantId)
    .maybeSingle();

  const tenantName = tenant?.name || "Usaha Anda";

  return (
    <div className="py-2">
      <NewCardForm tenantName={tenantName} />
    </div>
  );
}

