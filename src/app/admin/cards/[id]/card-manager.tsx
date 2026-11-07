"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoyaltyCard } from "@/components/loyalty-card";
import { QRDialog } from "@/components/qr-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStampAction, voidStampAction, redeemCardAction } from "@/actions/stamps";
import {
  ArrowLeft,
  QrCode,
  Stamp,
  RotateCcw,
  Gift,
  Loader2,
  Clock,
  AlertCircle,
  Phone,
  FileText,
  ShieldAlert,
} from "lucide-react";
import type { Database } from "@/types/database";

type CardRow = Database["public"]["Tables"]["cards"]["Row"];

export interface CardHistoryItem {
  id: string | null;
  type: "stamp" | "void" | "redeem" | string | null;
  at: string | null;
  actor: string | null;
  note: string | null;
}

interface CardManagerProps {
  initialCard: CardRow;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  tenant: {
    id: string;
    name: string;
    logo_url: string | null;
    brand_color: string;
    reward_text: string;
  };
  lastStampId?: string | null;
  initialHistory: CardHistoryItem[];
}

export function CardManager({
  initialCard,
  customer,
  tenant,
  lastStampId: serverLastStampId,
  initialHistory,
}: CardManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [card, setCard] = useState<CardRow>(initialCard);
  const [lastStampId, setLastStampId] = useState<string | null>(serverLastStampId || null);
  const [history, setHistory] = useState<CardHistoryItem[]>(initialHistory);

  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog confirmation states
  const [confirmVoidOpen, setConfirmVoidOpen] = useState(false);
  const [confirmRedeemOpen, setConfirmRedeemOpen] = useState(false);

  const isCompleted = card.status === "completed" || card.stamps_count >= card.stamps_required;

  // 1. Tambah Stempel (+ Optimistic update)
  const handleAddStamp = async () => {
    if (isCompleted || isAdding) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Simpan state sebelumnya untuk rollback
    const prevCard = { ...card };
    const prevHistory = [...history];

    // Optimistic state
    const optimisticCount = card.stamps_count + 1;
    const willComplete = optimisticCount >= card.stamps_required;

    setCard((c) => ({
      ...c,
      stamps_count: optimisticCount,
      status: willComplete ? "completed" : "active",
      completed_at: willComplete ? new Date().toISOString() : c.completed_at,
    }));

    setIsAdding(true);

    try {
      const res = await addStampAction({
        cardId: card.id,
        note: note.trim() ? note.trim() : null,
      });

      if (!res.success) {
        // Rollback
        setCard(prevCard);
        setHistory(prevHistory);
        setErrorMessage(res.error);
        return;
      }

      setCard(res.card);
      setNote("");
      setShowNoteInput(false);
      setSuccessMessage("Stempel berhasil ditambahkan!");

      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      // Rollback
      setCard(prevCard);
      setHistory(prevHistory);
      const msg = err instanceof Error ? err.message : "Gagal menambah stempel.";
      setErrorMessage(msg);
    } finally {
      setIsAdding(false);
    }
  };

  // 2. Batal Stempel
  const handleVoidStamp = async () => {
    if (!lastStampId || isVoiding) return;

    setConfirmVoidOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsVoiding(true);

    try {
      const res = await voidStampAction({ stampId: lastStampId });

      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }

      setCard(res.card);
      setLastStampId(null);
      setSuccessMessage("Stempel terakhir berhasil dibatalkan.");

      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan stempel.";
      setErrorMessage(msg);
    } finally {
      setIsVoiding(false);
    }
  };

  // 3. Tukar Hadiah
  const handleRedeem = async () => {
    if (!isCompleted || isRedeeming) return;

    setConfirmRedeemOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsRedeeming(true);

    try {
      const res = await redeemCardAction({ cardId: card.id });

      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }

      setCard(res.card);
      setLastStampId(null);
      setSuccessMessage("Hadiah berhasil ditukarkan! Kartu direset untuk siklus berikutnya.");

      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menukar hadiah.";
      setErrorMessage(msg);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
          href="/admin/cards"
          className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Kembali ke Daftar Kartu
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowQR(true)}
            className="text-xs"
          >
            <QrCode className="w-3.5 h-3.5 mr-1.5 text-zinc-600 dark:text-zinc-400" />
            Tampilkan QR Pelanggan
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-medium"
        >
          {successMessage}
        </div>
      )}

      {/* Main Grid: Card Preview & Action Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Loyalty Card Component */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <LoyaltyCard
            tenantName={tenant.name}
            logoUrl={tenant.logo_url}
            brandColor={tenant.brand_color}
            customerName={customer.name}
            stampsCount={card.stamps_count}
            stampsRequired={card.stamps_required}
            rewardText={tenant.reward_text}
            status={card.status}
          />

          <div className="mt-4 w-full max-w-[420px] p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-zinc-500">
              <span>Status Kartu:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  isCompleted
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {isCompleted ? "Penuh (Siap Ditukar)" : "Aktif"}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-500">
              <span>Siklus Berjalan:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Siklus ke-{card.current_cycle}
              </span>
            </div>
            {customer.phone && (
              <div className="flex justify-between items-center text-zinc-500">
                <span>No. Telepon:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-zinc-400" />
                  {customer.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cashier Operations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Operations Panel */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Operasi Stempel & Hadiah
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Pilih aksi yang ingin diterapkan pada kartu pelanggan ini.
              </p>
            </div>

            {/* Note input toggle */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                {showNoteInput ? "Sembunyikan catatan" : "+ Tambah catatan stempel (opsional)"}
              </button>

              {showNoteInput && (
                <div className="animate-in fade-in">
                  <Input
                    type="text"
                    placeholder="Contoh: No. Nota #1029 atau Pesanan Kopi Susu"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={255}
                    className="text-xs"
                    disabled={isAdding}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Tambah Stempel */}
              <Button
                type="button"
                onClick={handleAddStamp}
                disabled={isCompleted || isAdding || isVoiding || isRedeeming}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-11 text-sm font-semibold shadow-sm"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Stamp className="w-4 h-4 mr-2" />
                    + Tambah Stempel
                  </>
                )}
              </Button>

              {/* Tukar Hadiah (if completed) */}
              {isCompleted && (
                <Button
                  type="button"
                  onClick={() => setConfirmRedeemOpen(true)}
                  disabled={isRedeeming || isAdding || isVoiding}
                  className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold h-11 text-sm shadow-md animate-bounce"
                >
                  <Gift className="w-4 h-4 mr-2 text-amber-900" />
                  Tukar Hadiah
                </Button>
              )}
            </div>

            {/* Secondary actions: Batal stempel */}
            {lastStampId && !isCompleted && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmVoidOpen(true)}
                  disabled={isVoiding || isAdding || isRedeeming}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900"
                >
                  {isVoiding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Membatalkan...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Batal Stempel Terakhir
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* History Panel */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              Riwayat Transaksi Kartu
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                Belum ada aktivitas transaksi pada kartu ini.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => {
                  const dateStr = item.at
                    ? new Date(item.at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  let typeBadge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                      Stempel
                    </span>
                  );

                  if (item.type === "void") {
                    typeBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        Batal Stempel
                      </span>
                    );
                  } else if (item.type === "redeem") {
                    typeBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Tukar Hadiah
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {typeBadge}
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {dateStr}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-zinc-600 dark:text-zinc-300 italic truncate">
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Void Stamp */}
      {confirmVoidOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-base">Batalkan Stempel Terakhir?</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Tindakan ini akan mengurangi 1 stempel pada kartu pelanggan untuk siklus berjalan.
              Stempel yang dibatalkan akan dicatat dalam riwayat audit.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmVoidOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleVoidStamp}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Redeem Card */}
      {confirmRedeemOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Gift className="w-5 h-5" />
              <h3 className="font-bold text-base">Konfirmasi Penukaran Hadiah</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Berikan hadiah:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {tenant.reward_text}
              </strong>
              . Stempel kartu akan direset menjadi 0 dan siklus kartu akan naik ke siklus berikutnya.
              QR pelanggan tetap sama.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmRedeemOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRedeem}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold"
              >
                Konfirmasi Penukaran
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Dialog */}
      <QRDialog
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        publicToken={card.public_token}
        customerName={customer.name}
        tenantName={tenant.name}
      />
    </div>
  );
}
