import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// In-memory rate limiting untuk /c/* (60 req / menit per IP)
const ipRateLimit = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimit.get(ip);

  if (!entry || now > entry.expiresAt) {
    ipRateLimit.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 60) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, response, user } = await updateSession(request);

  // 1. Rate limiting untuk publik kartu /c/*
  if (pathname.startsWith("/c/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    if (!checkRateLimit(ip)) {
      return new NextResponse("Terlalu banyak permintaan. Silakan tunggu 1 menit.", {
        status: 429,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }

  // 2. Proteksi rute /admin/*
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cek tenant aktif dari cookie atau database
    let activeTenantId = request.cookies.get("active_tenant")?.value;

    if (!activeTenantId) {
      // Ambil tenant pertama user
      const { data: member } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!member?.tenant_id) {
        // User belum memiliki tenant, arahkan ke onboarding
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      activeTenantId = member.tenant_id;
      response.cookies.set("active_tenant", activeTenantId, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
    }

    return response;
  }

  // 3. Rute /onboarding
  if (pathname === "/onboarding") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Jika user sudah memiliki tenant, arahkan ke /admin
    const { data: member } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (member?.tenant_id) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
  }

  // 4. Rute /login & /register
  if (pathname === "/login" || pathname === "/register") {
    if (user) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

