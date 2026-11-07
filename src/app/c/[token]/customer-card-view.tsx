"use client";

import React, { useState } from "react";
import { LoyaltyCard } from "@/components/loyalty-card";
import { Award, Copy, Check, QrCode, Smartphone, Info } from "lucide-react";
import QRCode from "qrcode";
import { useDialog } from "@/lib/use-dialog";

interface CustomerCardViewProps {
  card: {
    tenant_name: string;
    logo_url: string | null;
    brand_color: string;
    customer_name: string;
    stamps_count: number;
    stamps_required: number;
    reward_text: string;
    status: string;
    current_cycle?: number;
    rewards_redeemed?: number;
    card_bg_url?: string | null;
    stamp_icon_url?: string | null;
    stamp_color?: string;
    stamp_has_border?: boolean;
  };
  token?: string;
}

export function CustomerCardView({ card }: CustomerCardViewProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrFailed, setQrFailed] = useState(false);
  const qrDialogRef = useDialog<HTMLDivElement>(showQRModal, () => setShowQRModal(false));

  const redeemedCount = Number(card.rewards_redeemed) || 0;
  const isCompleted = card.status === "completed" || card.stamps_count >= card.stamps_required;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 4000);
    }
  };

  const handleOpenQR = () => {
    setQrFailed(false);
    QRCode.toDataURL(window.location.href, {
      margin: 2,
      width: 280,
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => {
        setQrDataUrl(url);
        setShowQRModal(true);
      })
      .catch(() => {
        setQrFailed(true);
        setTimeout(() => setQrFailed(false), 4000);
      });
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center gap-4 animate-intro-in">
      {/* Kartu Loyalitas */}
      <LoyaltyCard
        tenantName={card.tenant_name}
        logoUrl={card.logo_url}
        brandColor={card.brand_color}
        customerName={card.customer_name}
        stampsCount={card.stamps_count}
        stampsRequired={card.stamps_required}
        rewardText={card.reward_text}
        status={card.status}
        currentCycle={card.current_cycle || 1}
        cardBgUrl={card.card_bg_url}
        stampIconUrl={card.stamp_icon_url}
        stampColor={card.stamp_color}
        stampHasBorder={card.stamp_has_border}
      />

      {/* Action buttons for Customer */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleOpenQR}
          className="flex items-center justify-center gap-2 min-h-11 py-2.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium transition"
        >
          <QrCode className="w-4 h-4 text-blue-900 dark:text-blue-400" />
          <span>Tampilkan QR</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 min-h-11 py-2.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-blue-900 dark:text-blue-400" />
              <span>Salin Tautan</span>
            </>
          )}
        </button>
      </div>

      {(copyFailed || qrFailed) && (
        <p role="alert" className="w-full text-center text-xs text-red-700 dark:text-red-300">
          {copyFailed
            ? "Tautan tidak bisa disalin otomatis. Salin dari bilah alamat peramban."
            : "Kode QR gagal dibuat. Muat ulang halaman lalu coba lagi."}
        </p>
      )}

      {/* Info Hadiah yang Sudah Pernah Ditukar */}
      {redeemedCount > 0 && (
        <div className="w-full rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-center gap-2 text-xs text-slate-800 dark:text-slate-200">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Hadiah yang pernah didapat: <strong>{redeemedCount} kali</strong></span>
        </div>
      )}

      {/* Petunjuk Penggunaan untuk Pelanggan */}
      <div className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
          <Info className="w-4 h-4 text-blue-900 dark:text-blue-400 shrink-0" />
          <span>Cara Menggunakan Kartu Ini</span>
        </div>
        <p className="leading-relaxed">
          {isCompleted
            ? `Tunjukkan halaman ini kepada kasir ${card.tenant_name} untuk menukarkan hadiah: ${card.reward_text}.`
            : `Tunjukkan halaman ini atau kode QR kepada kasir ${card.tenant_name} setiap kali berbelanja untuk mengumpulkan stempel.`}
        </p>
        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Simpan bookmark link ini di peramban ponsel Anda agar mudah diakses kembali.</span>
        </div>
      </div>

      {/* Modal QR Code Pelanggan */}
      {showQRModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-qr-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-intro-in"
          onClick={() => setShowQRModal(false)}
        >
          <div
            ref={qrDialogRef}
            tabIndex={-1}
            className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-4 text-slate-900 dark:text-white outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 id="customer-qr-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
                Kode QR Pelanggan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {card.customer_name} &bull; {card.tenant_name}
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 mx-auto w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code Pelanggan"
                className="w-48 h-48 object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kasir dapat memindai QR ini untuk membuka kartu dan menambahkan stempel.
            </p>

            <button
              type="button"
              onClick={() => setShowQRModal(false)}
              className="w-full min-h-11 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

