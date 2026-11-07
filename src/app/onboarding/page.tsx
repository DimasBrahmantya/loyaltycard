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
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Selamat Datang! Buat Usaha Anda
          </CardTitle>
          <CardDescription>
            Langkah pertama untuk memulai: tentukan nama usaha dan tautan profil kartu loyalitas Anda.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div
                role="alert"
                className="p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900"
              >
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nama Usaha / Brand</Label>
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
              />
              <p className="text-xs text-zinc-500">2 - 80 karakter.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug / Tautan Unik</Label>
              <div className="flex items-center rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                <span className="px-3 py-2 text-sm text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 select-none">
                  kartu/
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
                  title="3-40 karakter, huruf kecil, angka, dan tanda hubung (-)"
                  className="flex-1 h-10 px-3 py-2 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  disabled={isPending}
                />
              </div>
              <p className="text-xs text-zinc-500">
                3 - 40 karakter huruf kecil, angka, dan tanda hubung (-).
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || name.trim().length < 2 || slug.length < 3}
            >
              {isPending ? "Membuat Usaha..." : "Buat Usaha & Lanjutkan"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

