import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pendaftaran Profil Usaha - LoyaltyCard",
  description:
    "Langkah awal memulai: tentukan nama usaha dan tautan unik untuk kartu loyalitas pelanggan.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

