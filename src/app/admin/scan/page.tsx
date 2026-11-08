import { connection } from "next/server";
import { ScannerView } from "./scanner-view";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Scan QR Pelanggan - Admin Kasir",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminScanPage() {
  await connection();
  return (
    <div className="max-w-xl mx-auto py-2">
      <ScannerView />
    </div>
  );
}

