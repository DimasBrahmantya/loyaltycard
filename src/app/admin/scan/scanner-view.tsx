"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { scanAndStampAction, type ScanAndStampResult } from "@/actions/stamps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Award,
  Keyboard,
  ShieldCheck,
  SwitchCamera,
} from "lucide-react";

function playSuccessChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch {
    // Audio context not allowed or unsupported
  }
}

export function ScannerView() {
  const [isMounted, setIsMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanAndStampResult | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [manualToken, setManualToken] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    // Pause scanner visual
    try {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.pause(true);
      }
    } catch {
      // ignore pause error
    }

    try {
      const res = await scanAndStampAction({ qrContent: decodedText });
      setScanResult(res);
      if (res.success) {
        playSuccessChime();
      }
    } catch (err) {
      setScanResult({
        success: false,
        error: err instanceof Error ? err.message : "Terjadi kesalahan sistem saat memproses stempel.",
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const startScanner = useCallback(
    async (mode: "environment" | "user" = facingMode) => {
      setCameraError(null);
      setScanResult(null);
      isProcessingRef.current = false;

      // Lazy import html5-qrcode on client only
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        // Clean up previous instance if running
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            scannerRef.current.clear();
          } catch {
            // ignore
          }
        }

        const scannerId = "qr-reader-container";
        const container = document.getElementById(scannerId);
        if (!container) return;

        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: mode },
          {
            fps: 10,
            qrbox: (w: number, h: number) => {
              const edge = Math.floor(Math.min(w, h) * 0.72);
              return { width: edge, height: edge };
            },
          },
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // scan failure callback (silent during normal frame search)
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error("Camera scanner error:", err);
        setIsScanning(false);
        const errMsg =
          err instanceof Error
            ? err.name === "NotAllowedError" || err.message.includes("Permission")
              ? "Akses kamera ditolak. Berikan izin kamera di peramban Anda untuk memindai QR code."
              : err.name === "NotFoundError" || err.message.includes("Requested device not found")
              ? "Tidak ada kamera yang ditemukan pada perangkat ini."
              : `Gagal mengaktifkan kamera: ${err.message}`
            : "Gagal mengaktifkan kamera.";
        setCameraError(errMsg);
      }
    },
    [facingMode, handleScanSuccess]
  );

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      setIsScanning(false);
    }
  }, []);

  // Initialize scanner on mount
  useEffect(() => {
    if (!isMounted) return;
    startScanner(facingMode);

    return () => {
      stopScanner();
    };
  }, [isMounted, facingMode, startScanner, stopScanner]);

  const handleResumeScan = () => {
    setScanResult(null);
    isProcessingRef.current = false;

    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
        return;
      } catch {
        // If resume fails, restart fresh
      }
    }
    startScanner(facingMode);
  };

  const handleToggleCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim() || isProcessing) return;

    setIsProcessing(true);
    setScanResult(null);

    try {
      const res = await scanAndStampAction({ qrContent: manualToken.trim() });
      setScanResult(res);
      if (res.success) {
        playSuccessChime();
        setManualToken("");
      }
    } catch (err) {
      setScanResult({
        success: false,
        error: err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-900 dark:text-blue-400" />
            <span>Scan QR Pelanggan</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Arahkan kamera ke QR pelanggan untuk menambah stempel otomatis
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleCamera}
            title="Ganti Kamera Depan / Belakang"
            className="h-9 px-2.5 text-xs border-slate-200 dark:border-slate-800"
          >
            <SwitchCamera className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline ml-1 text-xs">Ganti Kamera</span>
          </Button>
        </div>
      </div>

      {/* Keamanan Kasir Badge */}
      <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-300">
        <ShieldCheck className="w-4 h-4 shrink-0 text-blue-700 dark:text-blue-400" />
        <span className="leading-tight">
          <strong>Mode Kasir Terverifikasi:</strong> Setiap scan otomatis divalidasi dan menambah stempel ke kartu pelanggan.
        </span>
      </div>

      {/* Main Viewfinder Card */}
      <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-md">
        {/* Container for html5-qrcode */}
        <div
          id="qr-reader-container"
          className="w-full min-h-[320px] sm:min-h-[360px] flex items-center justify-center bg-slate-950"
        />

        {/* Overlay Scanner Line & Framing (ketika sedang aktif scan dan belum ada hasil) */}
        {isScanning && !scanResult && !isProcessing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64 border-2 border-dashed border-blue-400/70 rounded-2xl flex items-center justify-center">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 -mt-0.5 -ml-0.5 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 -mt-0.5 -mr-0.5 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 -mb-0.5 -ml-0.5 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 -mb-0.5 -mr-0.5 rounded-br-lg" />

              {/* Scanning laser line animation */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#60a5fa] animate-pulse" />
            </div>
          </div>
        )}

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white z-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            <div className="text-center">
              <p className="text-sm font-semibold">Memproses Stempel...</p>
              <p className="text-xs text-slate-400">Menyimpan stempel baru ke sistem</p>
            </div>
          </div>
        )}

        {/* Error Kamera / Izin Overlay */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white z-20 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-900/40 border border-red-700/60 flex items-center justify-center text-red-400">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-bold text-red-300">Kamera Tidak Aktif</p>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startScanner(facingMode)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Coba Lagi
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowManualInput(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Keyboard className="w-3.5 h-3.5 mr-1.5" />
                Input Manual
              </Button>
            </div>
          </div>
        )}

        {/* Result Overlay Card (Tampil Begitu Scan Selesai) */}
        {scanResult && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-intro-in">
            {scanResult.success ? (
              <div className="w-full max-w-sm space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-3 h-3" />
                    Stempel Berhasil Ditambahkan!
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {scanResult.customerName}
                  </h3>
                  <div className="text-sm text-slate-300 font-medium">
                    Total:{" "}
                    <strong className="text-emerald-400 text-base">
                      {scanResult.stampsCount}
                    </strong>{" "}
                    / {scanResult.stampsRequired} stempel
                  </div>
                </div>

                {scanResult.isCompleted && (
                  <div className="p-3 rounded-xl bg-blue-900/30 border border-blue-500/30 text-xs text-blue-200 flex items-center justify-center gap-2">
                    <Award className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      <strong>Kartu Penuh!</strong> Pelanggan siap menukarkan hadiah sekarang.
                    </span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={handleResumeScan}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-11"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Scan Pelanggan Lain
                  </Button>

                  <Link href={`/admin/cards/${scanResult.card.id}`} className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent hover:bg-white/10 text-white border-white/20 text-xs h-11"
                    >
                      Buka Kartu
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Gagal Menambah Stempel</h3>
                  <p className="text-xs text-red-300 leading-relaxed max-w-xs mx-auto">
                    {scanResult.error}
                  </p>
                </div>

                {scanResult.cardId && (
                  <Link href={`/admin/cards/${scanResult.cardId}`} className="block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-white/5 hover:bg-white/10 text-white border-white/20 text-xs h-10"
                    >
                      Lihat Kartu {scanResult.customerName || "Pelanggan"}
                    </Button>
                  </Link>
                )}

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleResumeScan}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs h-11"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Coba Scan Ulang
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Input Fallback Accordion */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Input Manual (Jika Kamera Bermasalah)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-xs text-blue-900 dark:text-blue-400 hover:underline font-medium"
          >
            {showManualInput ? "Sembunyikan" : "Buka"}
          </button>
        </div>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="space-y-2.5 pt-1">
            <p className="text-[11px] text-slate-500">
              Masukkan tautan kartu pelanggan (misal: <code>https://.../c/abcde123</code>) atau kode token pelanggan:
            </p>
            <div className="flex gap-2">
              <Input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Tempel link kartu atau token di sini..."
                className="text-xs h-10"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                disabled={!manualToken.trim() || isProcessing}
                className="bg-blue-900 hover:bg-blue-950 text-white text-xs shrink-0 h-10 px-4"
              >
                {isProcessing ? "Memproses..." : "Tambah Stempel"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

