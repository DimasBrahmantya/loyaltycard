"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  updateTenantAction,
  uploadLogoAction,
  uploadCardBgAction,
  uploadStampIconAction,
  type UpdateTenantInput,
} from "@/actions/tenant";
import { processLogoFile } from "@/lib/utils/logo-cutout";
import { createClient } from "@/lib/supabase/client";
import { LoyaltyCard } from "@/components/loyalty-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Palette,
  Image as ImageIcon,
  Stamp,
} from "lucide-react";

const settingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama usaha minimal 2 karakter")
    .max(80, "Nama usaha maksimal 80 karakter"),
  brand_color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format warna hex harus 6 digit (contoh: #1e3a8a)"),
  reward_text: z
    .string()
    .trim()
    .min(1, "Hadiah tidak boleh kosong")
    .max(100, "Hadiah maksimal 100 karakter"),
  stamps_required: z
    .number()
    .int()
    .min(3, "Minimal 3 stempel")
    .max(20, "Maksimal 20 stempel"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    brand_color: string;
    reward_text: string;
    stamps_required: number;
    card_bg_url?: string | null;
    stamp_icon_url?: string | null;
    stamp_color?: string;
    stamp_has_border?: boolean;
  };
}

const PRESET_COLORS = [
  { label: "Midnight Navy", hex: "#1e3a8a" },
  { label: "Graphite Slate", hex: "#334155" },
  { label: "Emerald Olive", hex: "#047857" },
  { label: "Rich Burgundy", hex: "#881337" },
  { label: "Caramel Bronze", hex: "#b45309" },
  { label: "Warm Amber", hex: "#d97706" },
];

const PRESET_STAMP_COLORS = [
  { label: "Putih", hex: "#ffffff" },
  { label: "Emas", hex: "#f59e0b" },
  { label: "Merah", hex: "#ef4444" },
  { label: "Hijau", hex: "#10b981" },
  { label: "Cyan", hex: "#38bdf8" },
  { label: "Slate", hex: "#94a3b8" },
];

export function SettingsForm({ tenant }: SettingsFormProps) {
  // 1. Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant.logo_url);
  const [removeLogoBg, setRemoveLogoBg] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 2. Card Background state
  const [cardBgUrl, setCardBgUrl] = useState<string | null>(tenant.card_bg_url || null);
  const [isUploadingCardBg, setIsUploadingCardBg] = useState(false);
  const [cardBgError, setCardBgError] = useState<string | null>(null);

  // 3. Stamp Customization state
  const [stampSource, setStampSource] = useState<"logo" | "custom">(
    tenant.stamp_icon_url ? "custom" : "logo"
  );
  const [stampIconUrl, setStampIconUrl] = useState<string | null>(tenant.stamp_icon_url || null);
  const [removeStampBg, setRemoveStampBg] = useState(true);
  const [isUploadingStampIcon, setIsUploadingStampIcon] = useState(false);
  const [stampIconError, setStampIconError] = useState<string | null>(null);
  const [stampColor, setStampColor] = useState<string>(tenant.stamp_color || "#ffffff");
  const [stampHasBorder, setStampHasBorder] = useState<boolean>(
    tenant.stamp_has_border !== undefined ? tenant.stamp_has_border : true
  );

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: tenant.name,
      brand_color: tenant.brand_color,
      reward_text: tenant.reward_text,
      stamps_required: tenant.stamps_required,
    },
  });

  const watchedValues = useWatch({ control });
  const watchedName = watchedValues.name || tenant.name;
  const watchedColor = watchedValues.brand_color || tenant.brand_color;
  const watchedReward = watchedValues.reward_text || tenant.reward_text;
  const watchedStamps = Number(watchedValues.stamps_required) || tenant.stamps_required;

  // Handle Logo Upload (with removeLogoBg toggle)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploadingLogo(true);

    try {
      const { blob } = await processLogoFile(file, {
        removeBackground: removeLogoBg,
        maxDimension: 240,
      });

      let publicUrl: string | null = null;
      const supabase = createClient();
      const filePath = `${tenant.id}/logo.png`;

      const { error: uploadErr } = await supabase.storage
        .from("logos")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from("logos")
          .getPublicUrl(filePath);
        publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      } else {
        const formData = new FormData();
        formData.append("logo", blob, "logo.png");
        const serverRes = await uploadLogoAction(formData);
        if (!serverRes.success) {
          throw new Error(serverRes.error);
        }
        publicUrl = serverRes.publicUrl;
      }

      setLogoUrl(publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses gambar logo.";
      setUploadError(msg);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setUploadError(null);
  };

  // Handle Card Background Upload
  const handleCardBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCardBgError(null);
    setIsUploadingCardBg(true);

    try {
      const { blob } = await processLogoFile(file, {
        removeBackground: false,
        maxDimension: 1200,
      });

      let publicUrl: string | null = null;
      const supabase = createClient();
      const filePath = `${tenant.id}/card_bg.png`;

      const { error: uploadErr } = await supabase.storage
        .from("logos")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from("logos")
          .getPublicUrl(filePath);
        publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      } else {
        const formData = new FormData();
        formData.append("card_bg", blob, "card_bg.png");
        const serverRes = await uploadCardBgAction(formData);
        if (!serverRes.success) {
          throw new Error(serverRes.error);
        }
        publicUrl = serverRes.publicUrl;
      }

      setCardBgUrl(publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses gambar latar kartu.";
      setCardBgError(msg);
    } finally {
      setIsUploadingCardBg(false);
      e.target.value = "";
    }
  };

  const handleRemoveCardBg = () => {
    setCardBgUrl(null);
    setCardBgError(null);
  };

  // Handle Stamp Icon Upload
  const handleStampIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStampIconError(null);
    setIsUploadingStampIcon(true);

    try {
      const { blob } = await processLogoFile(file, {
        removeBackground: removeStampBg,
        maxDimension: 160,
      });

      let publicUrl: string | null = null;
      const supabase = createClient();
      const filePath = `${tenant.id}/stamp_icon.png`;

      const { error: uploadErr } = await supabase.storage
        .from("logos")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from("logos")
          .getPublicUrl(filePath);
        publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      } else {
        const formData = new FormData();
        formData.append("stamp_icon", blob, "stamp_icon.png");
        const serverRes = await uploadStampIconAction(formData);
        if (!serverRes.success) {
          throw new Error(serverRes.error);
        }
        publicUrl = serverRes.publicUrl;
      }

      setStampIconUrl(publicUrl);
      setStampSource("custom");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses ikon stempel.";
      setStampIconError(msg);
    } finally {
      setIsUploadingStampIcon(false);
      e.target.value = "";
    }
  };

  const handleRemoveStampIcon = () => {
    setStampIconUrl(null);
    setStampSource("logo");
    setStampIconError(null);
  };

  const onSubmit = async (data: SettingsFormData) => {
    setActionSuccess(null);
    setActionError(null);

    const payload: UpdateTenantInput = {
      name: data.name,
      brand_color: data.brand_color,
      reward_text: data.reward_text,
      stamps_required: data.stamps_required,
      logo_url: logoUrl,
      card_bg_url: cardBgUrl,
      stamp_icon_url: stampSource === "custom" ? stampIconUrl : null,
      stamp_color: stampColor,
      stamp_has_border: stampHasBorder,
    };

    const res = await updateTenantAction(payload);
    if (res.success) {
      setActionSuccess(res.message || "Pengaturan usaha berhasil disimpan.");
    } else {
      setActionError(res.error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Kolom Form Pengaturan */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Pengaturan Identitas Usaha & Kartu
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sesuaikan nama usaha, logo, latar kartu, ketentuan hadiah, dan gaya stempel pelanggan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {actionSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Nama Usaha */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Usaha
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Contoh: Kopi Kawan Setia"
                  disabled={isSubmitting}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Slug (Read-only) */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tautan Unik Usaha (Slug)
                </Label>
                <Input
                  id="slug"
                  value={tenant.slug}
                  disabled
                  className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Slug unik usaha tidak dapat diubah setelah dibuat demi menjaga kevalidan QR code pelanggan.
                </p>
              </div>

              {/* 1. Logo Usaha & Opsi Background Cutout */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Logo Usaha
                </Label>

                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative group w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center p-1.5 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Logo Usaha"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] text-slate-400 text-center px-1">
                      Belum ada logo
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 h-10 px-3.5 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo || isSubmitting}
                        />
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Unggah Logo
                          </>
                        )}
                      </label>

                      {logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={isUploadingLogo || isSubmitting}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs h-10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Hapus
                        </Button>
                      )}
                    </div>

                    {/* Toggle: Hapus Background Logo Otomatis */}
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={removeLogoBg}
                        onChange={(e) => setRemoveLogoBg(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <span>Hapus latar belakang logo otomatis (transparan)</span>
                    </label>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>

              {/* 2. Latar Belakang Kartu (Card Background) */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" />
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gambar Latar Kartu Loyalitas (Opsional)
                  </Label>
                </div>

                <div className="flex items-center gap-4">
                  {cardBgUrl ? (
                    <div className="relative group w-24 h-16 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardBgUrl}
                        alt="Latar Kartu"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] text-slate-400 text-center px-1">
                      Warna solid
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 h-10 px-3.5 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCardBgUpload}
                        disabled={isUploadingCardBg || isSubmitting}
                      />
                      {isUploadingCardBg ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          {cardBgUrl ? "Ganti Gambar Latar" : "Unggah Gambar Latar"}
                        </>
                      )}
                    </label>

                    {cardBgUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCardBg}
                        disabled={isUploadingCardBg || isSubmitting}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs h-10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Hapus Latar
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Gambar latar akan diberi lapisan gelap dan warna tema otomatis agar seluruh teks dan stempel tetap terbaca kontras.
                </p>

                {cardBgError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cardBgError}</span>
                  </p>
                )}
              </div>

              {/* 3. Kustomisasi Stempel (Icon, Border, Warna) */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" />
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kustomisasi Stempel
                  </Label>
                </div>

                {/* Sumber Ikon Stempel */}
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Pilihan Ikon Stempel:
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stamp_source"
                        checked={stampSource === "logo"}
                        onChange={() => setStampSource("logo")}
                        className="text-blue-900 focus:ring-blue-900"
                      />
                      <span>Sama dengan Logo Usaha</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stamp_source"
                        checked={stampSource === "custom"}
                        onChange={() => setStampSource("custom")}
                        className="text-blue-900 focus:ring-blue-900"
                      />
                      <span>Ikon Stempel Khusus</span>
                    </label>
                  </div>
                </div>

                {/* Upload Ikon Stempel jika pilihan "custom" */}
                {stampSource === "custom" && (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 animate-intro-in">
                    <div className="flex items-center gap-3">
                      {stampIconUrl ? (
                        <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center p-2 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stampIconUrl}
                            alt="Ikon Stempel Khusus"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 text-center">
                          Belum ada
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 h-9 px-3 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleStampIconUpload}
                              disabled={isUploadingStampIcon || isSubmitting}
                            />
                            {isUploadingStampIcon ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Mengunggah...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                Unggah Ikon Stempel
                              </>
                            )}
                          </label>

                          {stampIconUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveStampIcon}
                              disabled={isUploadingStampIcon || isSubmitting}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs h-9"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              Hapus
                            </Button>
                          )}
                        </div>

                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={removeStampBg}
                            onChange={(e) => setRemoveStampBg(e.target.checked)}
                            className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                          />
                          <span>Hapus latar belakang ikon stempel</span>
                        </label>
                      </div>
                    </div>

                    {stampIconError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{stampIconError}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Garis Lingkar (Border Ring) Stempel */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stampHasBorder}
                      onChange={(e) => setStampHasBorder(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <span>Tampilkan garis lingkar bulat (ring border) pada stempel</span>
                  </label>
                </div>

                {/* Warna Stempel & Garis Ring */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Warna Aksen Stempel & Garis Ring:
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_STAMP_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setStampColor(preset.hex)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                          stampColor.toLowerCase() === preset.hex.toLowerCase()
                            ? "border-blue-900 ring-2 ring-blue-900/20 bg-slate-100 dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-black/20"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="color"
                      id="stamp_color_picker"
                      value={/^#[0-9a-fA-F]{6}$/.test(stampColor) ? stampColor : "#ffffff"}
                      onChange={(e) => setStampColor(e.target.value)}
                      className="w-10 h-10 p-0 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer bg-transparent shrink-0"
                      disabled={isSubmitting}
                    />
                    <Input
                      id="stamp_color"
                      value={stampColor}
                      onChange={(e) => setStampColor(e.target.value)}
                      placeholder="#ffffff"
                      disabled={isSubmitting}
                      className="font-mono text-xs max-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Warna Tema Merek */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" />
                  <Label htmlFor="brand_color" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Warna Tema Merek (Hex)
                  </Label>
                </div>

                {/* Preset Swatches */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setValue("brand_color", preset.hex)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        watchedColor.toLowerCase() === preset.hex.toLowerCase()
                          ? "border-blue-900 ring-2 ring-blue-900/20 bg-slate-100 dark:bg-slate-800"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    id="brand_color_picker"
                    value={/^#[0-9a-fA-F]{6}$/.test(watchedColor) ? watchedColor : "#1e3a8a"}
                    onChange={(e) => setValue("brand_color", e.target.value)}
                    className="w-10 h-10 p-0 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer bg-transparent shrink-0"
                    disabled={isSubmitting}
                  />
                  <Input
                    id="brand_color"
                    {...register("brand_color")}
                    placeholder="#1e3a8a"
                    disabled={isSubmitting}
                    className="font-mono text-xs max-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
                {errors.brand_color && (
                  <p className="text-xs text-red-500">{errors.brand_color.message}</p>
                )}
              </div>

              {/* Hadiah */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Label htmlFor="reward_text" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Teks Hadiah Pelanggan
                </Label>
                <Input
                  id="reward_text"
                  {...register("reward_text")}
                  placeholder="Contoh: Gratis 1 Kopi Susu"
                  disabled={isSubmitting}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
                {errors.reward_text && (
                  <p className="text-xs text-red-500">{errors.reward_text.message}</p>
                )}
              </div>

              {/* Jumlah Stempel */}
              <div className="space-y-1.5">
                <Label htmlFor="stamps_required" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Jumlah Stempel Diperlukan (3 - 20)
                </Label>
                <Input
                  id="stamps_required"
                  type="number"
                  min={3}
                  max={20}
                  {...register("stamps_required", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="max-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Perubahan jumlah stempel berlaku untuk kartu yang baru dibuat setelah disimpan.
                </p>
                {errors.stamps_required && (
                  <p className="text-xs text-red-500">
                    {errors.stamps_required.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingLogo || isUploadingCardBg || isUploadingStampIcon}
                  className="bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs h-11 px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Kolom Pratinjau Kartu Langsung */}
      <div className="lg:col-span-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Pratinjau Kartu Langsung
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tampilan kartu loyalitas yang akan langsung dilihat oleh pelanggan saat scan QR.
          </p>
        </div>

        <div className="flex justify-center p-6 bg-slate-950 rounded-xl border border-slate-800">
          <LoyaltyCard
            tenantName={watchedName}
            logoUrl={logoUrl}
            brandColor={watchedColor}
            customerName="Budi Santoso"
            stampsCount={Math.min(5, watchedStamps)}
            stampsRequired={watchedStamps}
            rewardText={watchedReward}
            status="active"
            cardBgUrl={cardBgUrl}
            stampIconUrl={stampSource === "custom" ? stampIconUrl : logoUrl}
            stampColor={stampColor}
            stampHasBorder={stampHasBorder}
          />
        </div>
      </div>
    </div>
  );
}
