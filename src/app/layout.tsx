import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoyaltyCard: Kartu Loyalitas Digital UMKM",
  description: "Platform kartu loyalitas digital tanpa unduh aplikasi untuk pelanggan setia usaha Anda.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col font-sans transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
