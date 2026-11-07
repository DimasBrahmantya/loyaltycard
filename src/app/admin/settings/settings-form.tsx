"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateTenantAction, uploadLogoAction, type UpdateTenantInput } from "@/actions/tenant";
import { processLogoFile } from "@/lib/utils/logo-cutout";
import { createClient } from "@/lib/supabase/client";
import { LoyaltyCard } from "@/components/loyalty-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const settingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama usaha minimal 2 karakter")
    .max(80, "Nama usaha maksimal 80 karakter"),
  brand_color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format warna hex harus 6 digit (contoh: #c2410c)"),
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
  };
}

export function SettingsForm({ tenant }: SettingsFormProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant.logo_url);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  // Handle Logo Upload + Auto-Cutout
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploadingLogo(true);

    try {
      // 1. Proses resize dan hapus background transparan di client
      const { blob } = await processLogoFile(file);

      let publicUrl: string | null = null;
      const supabase = createClient();
      const filePath = `${tenant.id}/logo.png`;

      // 2. Coba upload direct client-side
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
        // Fallback: upload via server action jika storage RLS client memblokir
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

  const onSubmit = async (data: SettingsFormData) => {
    setActionSuccess(null);
    setActionError(null);

    const payload: UpdateTenantInput = {
      name: data.name,
      brand_color: data.brand_color,
      reward_text: data.reward_text,
      stamps_required: data.stamps_required,
      logo_url: logoUrl,
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
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Usaha</CardTitle>
            <CardDescription>
              Ubah identitas visual, ketentuan hadiah, dan stempel kartu loyalitas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {actionSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Nama Usaha */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Usaha</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Contoh: Kopi Kenangan"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Logo Usaha */}
              <div className="space-y-2">
                <Label>Logo Usaha (Maks. 2MB)</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {logoUrl ? (
                    <div className="relative group w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 flex items-center justify-center p-1 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Logo Usaha"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-xs text-zinc-400 text-center px-1">
                      Belum ada logo
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors border border-zinc-300 bg-transparent hover:bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 h-8 px-3 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo || isSubmitting}
                      />
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1.5" />
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
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-500">
                  Background foto akan dihapus otomatis agar logo transparan dan kontras di dalam stempel.
                </p>

                {uploadError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>

              {/* Warna Merek */}
              <div className="space-y-1.5">
                <Label htmlFor="brand_color">Warna Merek</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brand_color_picker"
                    value={/^#[0-9a-fA-F]{6}$/.test(watchedColor) ? watchedColor : "#c2410c"}
                    onChange={(e) => setValue("brand_color", e.target.value)}
                    className="w-10 h-10 p-0 border border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer bg-transparent shrink-0"
                    disabled={isSubmitting}
                  />
                  <Input
                    id="brand_color"
                    {...register("brand_color")}
                    placeholder="#c2410c"
                    disabled={isSubmitting}
                    className="font-mono text-sm max-w-[140px]"
                  />
                </div>
                {errors.brand_color && (
                  <p className="text-xs text-red-500">{errors.brand_color.message}</p>
                )}
              </div>

              {/* Hadiah */}
              <div className="space-y-1.5">
                <Label htmlFor="reward_text">Teks Hadiah</Label>
                <Input
                  id="reward_text"
                  {...register("reward_text")}
                  placeholder="Contoh: Gratis 1 Kopi Susu"
                  disabled={isSubmitting}
                />
                {errors.reward_text && (
                  <p className="text-xs text-red-500">{errors.reward_text.message}</p>
                )}
              </div>

              {/* Jumlah Stempel */}
              <div className="space-y-1.5">
                <Label htmlFor="stamps_required">
                  Jumlah Stempel Diperlukan (3 - 20)
                </Label>
                <Input
                  id="stamps_required"
                  type="number"
                  min={3}
                  max={20}
                  {...register("stamps_required", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="max-w-[140px]"
                />
                <p className="text-xs text-zinc-500">
                  Perubahan jumlah stempel hanya berlaku untuk kartu baru yang dibuat setelah pengaturan disimpan.
                </p>
                {errors.stamps_required && (
                  <p className="text-xs text-red-500">
                    {errors.stamps_required.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting || isUploadingLogo}>
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
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Pratinjau Kartu
          </h2>
          <p className="text-xs text-zinc-500">
            Tampilan kartu loyalitas yang akan dilihat oleh pelanggan saat scan QR.
          </p>
        </div>

        <div className="flex justify-center p-4 bg-zinc-900/50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <LoyaltyCard
            tenantName={watchedName}
            logoUrl={logoUrl}
            brandColor={watchedColor}
            customerName="Budi Santoso"
            stampsCount={Math.min(7, watchedStamps)}
            stampsRequired={watchedStamps}
            rewardText={watchedReward}
            status="active"
          />
        </div>
      </div>
    </div>
  );
}
