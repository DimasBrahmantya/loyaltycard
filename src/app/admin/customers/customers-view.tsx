"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Search, Phone, Calendar, CreditCard, Plus } from "lucide-react";

export interface CustomerItem {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  cards: {
    id: string;
    stamps_count: number;
    stamps_required: number;
    status: string;
    public_token: string;
  }[];
}

interface CustomersViewProps {
  initialCustomers: CustomerItem[];
}

export function CustomersView({ initialCustomers }: CustomersViewProps) {
  const [search, setSearch] = useState("");

  const filteredCustomers = initialCustomers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(isoString));
  };

  return (
    <div className="space-y-4">
      {/* Search dan Tombol Tambah */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau telepon..."
            className="pl-9"
          />
        </div>

        <Link
          href="/admin/cards/new"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700 h-10 px-4 py-2 gap-1.5 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan Baru</span>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Pelanggan</CardTitle>
              <CardDescription>
                {filteredCustomers.length} pelanggan ditemukan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {search ? "Tidak ada pelanggan yang cocok" : "Belum ada pelanggan terdaftar"}
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {search
                  ? "Coba gunakan kata kunci pencarian nama atau nomor telepon yang lain."
                  : "Pelanggan otomatis terdaftar saat Anda membuat kartu loyalitas pertama kali."}
              </p>
              {!search && (
                <Link
                  href="/admin/cards/new"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700 h-8 px-3 mt-4 shadow-sm"
                >
                  Buat Kartu Pertama
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs font-semibold">
                    <th className="pb-3 px-2">Nama Pelanggan</th>
                    <th className="pb-3 px-2">Nomor Telepon</th>
                    <th className="pb-3 px-2">Terdaftar</th>
                    <th className="pb-3 px-2">Status Kartu</th>
                    <th className="pb-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredCustomers.map((customer) => {
                    const card = customer.cards?.[0];

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {customer.name}
                        </td>
                        <td className="py-3 px-2 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {customer.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{customer.phone}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-xs text-zinc-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{formatDate(customer.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          {card ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  card.status === "completed"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                }`}
                              >
                                {card.status === "completed" ? "Siap Tukar" : "Aktif"}
                              </span>
                              <span className="text-xs text-zinc-500 font-mono">
                                ({card.stamps_count}/{card.stamps_required} stempel)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">Tidak ada kartu</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          {card ? (
                            <Link
                              href={`/admin/cards/${card.id}`}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors border border-zinc-300 bg-transparent hover:bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 h-8 px-2.5 gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Lihat Kartu</span>
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
