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
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0b1120] transition-colors relative">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl relative z-10 animate-intro-in">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-900/10 border border-blue-900/20 flex items-center justify-center text-blue-900 dark:text-blue-400 mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Daftar Akun Usaha Baru
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Buat akun untuk mulai menerbitkan kartu loyalitas digital bagi pelanggan usaha Anda.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div
                role="alert"
                className="p-3.5 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900 flex items-center gap-2 animate-intro-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{state.error}</span>
              </div>
            )}
            {state?.success && (
              <div
                role="status"
                className="p-3.5 text-xs rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900 flex items-center gap-2 animate-intro-in"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{state.message}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Anda
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@usaha.com"
                  required
                  disabled={isPending}
                  className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11 sm:h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kata Sandi
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  required
                  disabled={isPending}
                  className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11 sm:h-10"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs h-11"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mendaftarkan Akun...
                </>
              ) : (
                "Daftar & Buat Usaha"
              )}
            </Button>
            <p className="text-center text-xs text-slate-600 dark:text-slate-400">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link href="/terms" className="text-blue-900 dark:text-blue-400 underline hover:underline">
                Syarat Layanan
              </Link>{" "}
              dan{" "}
              <Link href="/privacy" className="text-blue-900 dark:text-blue-400 underline hover:underline">
                Kebijakan Privasi
              </Link>
              .
            </p>
            <p className="text-center text-xs text-slate-600 dark:text-slate-400">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-900 dark:text-blue-400 underline-offset-2 hover:underline"
              >
                Masuk ke akun Anda
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
