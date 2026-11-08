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
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0b1120] transition-colors relative">
      <Card className="w-full max-w-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl relative z-10 animate-intro-in">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-900/10 border border-blue-900/20 flex items-center justify-center text-blue-900 dark:text-blue-400 mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 rounded-full inline-block">
              Langkah 2 dari 2: Profil & Tautan Usaha
            </span>
            <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Daftarkan Usaha Anda
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Langkah akhir: tentukan nama usaha dan tautan unik untuk kartu loyalitas pelanggan.
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
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Usaha / Merek
              </Label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                  className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11 sm:h-10"
                />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">2 sampai 80 karakter.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Slug / Tautan Unik Usaha
              </Label>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-blue-900">
                <span className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 select-none flex items-center gap-1">
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
                  className="flex-1 h-11 sm:h-10 px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  disabled={isPending}
                />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                3 sampai 40 karakter huruf kecil, angka, dan tanda hubung (-).
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs h-11"
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
    </main>
  );
}
