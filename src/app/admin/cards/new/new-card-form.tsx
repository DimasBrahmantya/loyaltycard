"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCardAction } from "@/actions/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRDialog } from "@/components/qr-dialog";
import {
  CreditCard,
  User,
  Phone,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface NewCardFormProps {
  tenantName: string;
}

export function NewCardForm({ tenantName }: NewCardFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // QR Modal state
  const [createdCard, setCreatedCard] = useState<{
    id: string;
    public_token: string;
    customerName: string;
  } | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Nama pelanggan wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await createCardAction({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
      });

      if (!res.success) {
        setErrorMessage(res.error);
        setLoading(false);
        return;
      }

      setCreatedCard({
        id: res.card.id,
        public_token: res.card.public_token,
        customerName: name.trim(),
      });
      setShowQR(true);
      setName("");
      setPhone("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat membuat kartu.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/cards"
          className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Kembali ke Daftar Kartu
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            Buat Kartu Loyalitas Baru
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Daftarkan pelanggan baru untuk langsung mendapatkan kartu loyalitas digital.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium"
          >
            {errorMessage}
          </div>
        )}

        {createdCard && !showQR && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Kartu untuk {createdCard.customerName} berhasil dibuat!
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQR(true)}
                className="text-xs h-8 bg-white dark:bg-zinc-900"
              >
                Tampilkan QR Lagi
              </Button>
              <Link href={`/admin/cards/${createdCard.id}`}>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Buka Detail Kartu
                </Button>
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              Nama Pelanggan <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Contoh: Budi Santoso"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold">
              Nomor Telepon / WhatsApp (Opsional)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Contoh: 081234567890"
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Digunakan untuk pencarian kartu pelanggan di kasir.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membuat Kartu...
                </>
              ) : (
                "Simpan & Buat Kartu"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => router.push("/admin/cards")}
            >
              Batal
            </Button>
          </div>
        </form>
      </div>

      {/* QR Dialog Modal */}
      {createdCard && (
        <QRDialog
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          publicToken={createdCard.public_token}
          customerName={createdCard.customerName}
          tenantName={tenantName}
        />
      )}
    </div>
  );
}

