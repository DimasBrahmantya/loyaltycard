"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Lock, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0b1120] transition-colors">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 animate-intro-in">
        {/* Left Brand Panel */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 lg:p-10 text-white bg-gradient-to-br from-orange-600 via-blue-900 to-slate-950">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span>LoyaltyCard</span>
          </Link>

          <div className="space-y-3">
            <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-white/15 border border-white/20">
              Langkah 1 dari 2 &bull; Akun Pemilik
            </span>
            <h2 className="text-2xl font-bold leading-snug tracking-tight">
              Mulai program loyalitas digital dalam 2 menit.
            </h2>
            <p className="text-xs text-orange-100 leading-relaxed">
              Gratis untuk mulai. Tanpa biaya cetak kartu kertas, pelanggan langsung pakai via QR browser.
            </p>
          </div>

          <p className="text-[11px] font-medium text-orange-200">
            &#10003; Setup instan &nbsp; &#10003; Tanpa kartu kredit
          </p>
        </div>

        {/* Right Form Panel */}
        <Card className="md:col-span-7 border-0 shadow-none bg-transparent rounded-none p-2 sm:p-6">
          <CardHeader className="space-y-1.5 pb-4">
            <span className="md:hidden w-fit text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
              Langkah 1 dari 2: Pendaftaran Akun
            </span>
            <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Daftar Akun Usaha Baru
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Buat akun pemilik sebelum mengatur nama &amp; tautan usaha Anda.
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state?.error && (
                <div
                  role="alert"
                  className="p-3.5 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900 flex items-center gap-2 animate-intro-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{state.error}</span>
                </div>
              )}
              {state?.success && (
                <div
                  role="status"
                  className="p-3.5 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900 flex items-center gap-2 animate-intro-in"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{state.message}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Email Usaha / Pemilik
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="owner@usaha.com"
                    required
                    disabled={isPending}
                    className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Buat Kata Sandi (min. 6 karakter)
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    required
                    disabled={isPending}
                    className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm h-11 shadow-md shadow-orange-600/20"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mendaftarkan Akun...
                  </>
                ) : (
                  "Daftar & Lanjut ke Profil Usaha →"
                )}
              </Button>
              <p className="text-center text-xs text-slate-600 dark:text-slate-400">
                Dengan mendaftar, Anda menyetujui{" "}
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 underline hover:underline">
                  Syarat Layanan
                </Link>{" "}
                dan{" "}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 underline hover:underline">
                  Kebijakan Privasi
                </Link>
                .
              </p>
              <p className="text-center text-xs text-slate-600 dark:text-slate-400">
                Sudah memiliki akun?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 dark:text-blue-400 underline-offset-2 hover:underline"
                >
                  Masuk ke akun Anda
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
