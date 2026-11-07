"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoyaltyCard } from "@/components/loyalty-card";
import { QRDialog } from "@/components/qr-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStampAction, voidStampAction, redeemCardAction } from "@/actions/stamps";
import { useDialog } from "@/lib/use-dialog";
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
  CheckCircle2,
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
    card_bg_url?: string | null;
    stamp_icon_url?: string | null;
    stamp_color?: string;
    stamp_has_border?: boolean;
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

    const prevCard = { ...card };
    const prevHistory = [...history];

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

  const voidDialogRef = useDialog<HTMLDivElement>(confirmVoidOpen, () => setConfirmVoidOpen(false));
  const redeemDialogRef = useDialog<HTMLDivElement>(confirmRedeemOpen, () => setConfirmRedeemOpen(false));

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
          href="/admin/cards"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Kembali ke Daftar Kartu</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowQR(true)}
            className="text-xs border-slate-200 dark:border-slate-800"
          >
            <QrCode className="w-3.5 h-3.5 mr-1.5 text-blue-900 dark:text-blue-400" />
            <span>Tampilkan QR Pelanggan</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2.5 animate-intro-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-intro-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Card Preview & Action Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
            currentCycle={card.current_cycle}
            cardBgUrl={tenant.card_bg_url}
            stampIconUrl={tenant.stamp_icon_url}
            stampColor={tenant.stamp_color}
            stampHasBorder={tenant.stamp_has_border}
          />

          <div className="mt-4 w-full max-w-[420px] p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Status Kartu:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  isCompleted
                    ? "bg-blue-900/10 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-900/20"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {isCompleted ? "Penuh (Siap Ditukar)" : "Aktif"}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Siklus Berjalan:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Siklus ke-{card.current_cycle}
              </span>
            </div>
            {customer.phone && (
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>No. Telepon:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customer.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cashier Operations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Operations Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Operasi Stempel & Hadiah
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Pilih aksi kasir yang ingin diterapkan pada kartu pelanggan ini.
              </p>
            </div>

            {/* Note input toggle */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="text-xs text-blue-900 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1.5 min-h-11 sm:min-h-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showNoteInput ? "Sembunyikan catatan" : "+ Tambah catatan nota (opsional)"}</span>
              </button>

              {showNoteInput && (
                <div className="animate-intro-in">
                  <Input
                    type="text"
                    placeholder="Contoh: No. Nota #1029 atau Pesanan Kopi Susu"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={255}
                    className="text-xs bg-slate-50 dark:bg-slate-800/50"
                    disabled={isAdding}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Tambah Stempel */}
              <Button
                type="button"
                onClick={handleAddStamp}
                disabled={isCompleted || isAdding || isVoiding || isRedeeming}
                className="flex-1 bg-blue-900 hover:bg-blue-950 text-white h-12 text-sm font-bold"
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-sm"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Tukar Hadiah
                </Button>
              )}
            </div>

            {/* Secondary actions: Batal stempel */}
            {lastStampId && !isCompleted && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
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
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Riwayat Transaksi Kartu Ini</span>
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-400 py-6 text-center">
                Belum ada aktivitas transaksi pada kartu ini.
              </p>
            ) : (
              <div className="space-y-2.5">
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/10 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-900/20">
                      Stempel
                    </span>
                  );

                  if (item.type === "void") {
                    typeBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        Batal Stempel
                      </span>
                    );
                  } else if (item.type === "redeem") {
                    typeBadge = (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                        Tukar Hadiah
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start justify-between gap-3 text-xs border border-slate-100 dark:border-slate-800/50"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {typeBadge}
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                            {dateStr}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-slate-600 dark:text-slate-300 italic truncate text-[11px]">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-intro-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="void-dialog-title"
        >
          <div
            ref={voidDialogRef}
            tabIndex={-1}
            className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 outline-none"
          >
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 id="void-dialog-title" className="font-bold text-base">Batalkan Stempel Terakhir?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-intro-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="redeem-dialog-title"
        >
          <div
            ref={redeemDialogRef}
            tabIndex={-1}
            className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 outline-none"
          >
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
              <Gift className="w-5 h-5" />
              <h3 id="redeem-dialog-title" className="font-bold text-base">Konfirmasi Penukaran Hadiah</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Berikan hadiah:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
