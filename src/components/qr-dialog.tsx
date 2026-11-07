"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Copy, Download, Printer, X, Check, QrCode } from "lucide-react";

export interface QRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  publicToken: string;
  customerName?: string;
  tenantName?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function QRDialog({
  isOpen,
  onClose,
  publicToken,
  customerName = "Pelanggan",
  tenantName = "Kartu Loyalitas",
}: QRDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/c/${publicToken}`;

  useEffect(() => {
    if (!isOpen || !publicToken) return;

    let isMounted = true;
    QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: {
        dark: "#18181b",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message || "Gagal membuat QR Code");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, publicToken, publicUrl]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin link ke clipboard.");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      alert("Izinkan pop-up untuk mencetak QR code.");
      return;
    }

    const safeTenantName = escapeHtml(tenantName);
    const safeCustomerName = escapeHtml(customerName);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Kartu Loyalitas - ${safeCustomerName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px;
              text-align: center;
              color: #1c1917;
            }
            h1 { font-size: 22px; margin-bottom: 4px; font-weight: bold; }
            h2 { font-size: 16px; margin-top: 0; color: #57534e; font-weight: normal; }
            img { width: 260px; height: 260px; margin: 20px 0; border: 1px solid #e7e5e4; border-radius: 16px; padding: 12px; }
            p { font-size: 12px; color: #78716c; max-width: 300px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>${safeTenantName}</h1>
          <h2>Pelanggan: ${safeCustomerName}</h2>
          <img src="${qrDataUrl}" alt="QR Code" />
          <p>Scan QR code ini dari kamera ponsel untuk membuka status kartu loyalitas digital Anda.</p>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-intro-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-dialog-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col items-center gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog QR"
          className="absolute top-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <QrCode className="w-5 h-5 text-blue-900 dark:text-blue-400" />
          <h3 id="qr-dialog-title" className="text-base sm:text-lg font-bold">
            QR Kartu Pelanggan
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Tunjukkan atau bagikan QR ke pelanggan untuk melihat kartu loyalitas.
        </p>

        {/* QR Display */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-center min-w-[240px] min-h-[240px]">
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR Code untuk ${customerName}`}
              className="w-52 h-52 object-contain"
            />
          ) : (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900 border-t-transparent" />
          )}
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[260px]">
            {customerName}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate max-w-[260px]">
            {publicUrl}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 w-full pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex flex-col h-auto py-2.5 px-1 gap-1 text-[11px] border-slate-200 dark:border-slate-800 font-semibold"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
            <span>{copied ? "Tersalin!" : "Salin Link"}</span>
          </Button>

          {qrDataUrl ? (
            <a
              href={qrDataUrl}
              download={`qr-${customerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`}
              className="inline-flex"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex flex-col h-auto py-2.5 px-1 gap-1 text-[11px] w-full border-slate-200 dark:border-slate-800 font-semibold"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Unduh PNG</span>
              </Button>
            </a>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="flex flex-col h-auto py-2.5 px-1 gap-1 text-[11px]"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PNG</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!qrDataUrl}
            className="flex flex-col h-auto py-2.5 px-1 gap-1 text-[11px] border-slate-200 dark:border-slate-800 font-semibold"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Cetak</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
