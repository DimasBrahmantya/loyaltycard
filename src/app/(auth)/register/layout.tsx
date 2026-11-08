import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun Usaha Baru - LoyaltyCard",
  description:
    "Daftarkan akun usaha baru di LoyaltyCard dan mulai terbitkan kartu stempel loyalitas digital gratis untuk pelanggan Anda.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

