"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
        <AlertCircle aria-hidden="true" className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Data tidak bisa dimuat
        </h1>
        <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          Koneksi ke server terputus atau data sedang bermasalah. Perubahan yang sudah tersimpan tidak hilang. Coba muat ulang, atau kembali ke Ringkasan.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button type="button" onClick={() => retry()}>
          Muat Ulang Halaman Ini
        </Button>
        <Link href="/admin" className="w-full sm:w-auto">
          <Button type="button" variant="outline" className="w-full">
            Kembali ke Ringkasan
          </Button>
        </Link>
      </div>
    </div>
  );
}

