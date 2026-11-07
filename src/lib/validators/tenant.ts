import { z } from "zod";

export const createTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama usaha minimal 2 karakter")
    .max(80, "Nama usaha maksimal 80 karakter"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug minimal 3 karakter")
    .max(40, "Slug maksimal 40 karakter")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)"
    ),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

