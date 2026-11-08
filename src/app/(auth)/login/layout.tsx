import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk ke Dashboard - LoyaltyCard",
  description:
    "Masuk ke dashboard LoyaltyCard untuk mengelola kartu stempel digital, monitor pelanggan, dan kelola operasional usaha Anda.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

