"use client";

import { useActionState, useState } from "react";
import { createTenantAction } from "./actions";
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
import { Store, Link2, Loader2, AlertCircle } from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(createTenantAction, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isSlugManual) {
      setSlug(slugify(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManual(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40));
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0b1120] transition-colors">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 animate-intro-in">
        {/* Left Form Panel */}
        <Card className="md:col-span-7 border-0 shadow-none bg-transparent rounded-none p-2 sm:p-6">
          <CardHeader className="space-y-2 pb-4">
            <span className="w-fit text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full">
              Langkah 2 dari 2 &bull; Profil &amp; Tautan Usaha
            </span>
            <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Daftarkan Usaha Anda
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tentukan nama usaha dan tautan unik untuk kartu loyalitas pelanggan Anda.
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
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Nama Usaha / Merek
                </Label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Contoh: Kopi Kenangan Manis"
                    required
                    minLength={2}
                    maxLength={80}
                    disabled={isPending}
                    className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">2 sampai 80 karakter.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Slug / Tautan Unik Usaha
                </Label>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600">
                  <span className="px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 select-none flex items-center gap-1.5 font-medium">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>kartu/</span>
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="kopi-kenangan"
                    required
                    pattern="^[a-z0-9-]{3,40}$"
                    title="3-40 karakter huruf kecil, angka, dan tanda hubung (-)"
                    className="flex-1 h-11 px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    disabled={isPending}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  3 sampai 40 karakter huruf kecil, angka, dan tanda hubung (-).
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-11 shadow-md shadow-blue-600/20"
                disabled={isPending || name.trim().length < 2 || slug.length < 3}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mendaftarkan Usaha...
                  </>
                ) : (
                  "Buat Usaha & Masuk Dashboard"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Right Live Card Preview Panel */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-center items-center p-8 bg-blue-50/70 dark:bg-blue-950/20 border-l border-blue-100 dark:border-slate-800 gap-4">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
            Pratinjau Kartu Usaha Anda
          </span>
          <div className="w-full rounded-2xl p-5 text-white bg-gradient-to-br from-blue-600 via-blue-800 to-slate-950 shadow-xl shadow-blue-900/25 border border-white/15 space-y-3">
            <p className="text-base font-bold truncate">
              {name.trim() || "Nama Usaha Anda"}
            </p>
            <p className="text-[11px] text-blue-200 truncate">
              /kartu/{slug || "tautan-usaha"}
            </p>
            <div className="pt-2 border-t border-white/15 text-xs font-semibold text-white/90">
              10 Stempel &bull; Siap Dikustomisasi
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
