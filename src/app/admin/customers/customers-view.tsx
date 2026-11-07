"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Search, Phone, Calendar, CreditCard, Plus, User } from "lucide-react";

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
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau no. telepon pelanggan..."
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11 sm:h-10 rounded-lg"
          />
        </div>

        <Link
          href="/admin/cards/new"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors bg-blue-900 text-white hover:bg-blue-950 h-11 sm:h-10 px-4 py-2 gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan Baru</span>
        </Link>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daftar Pelanggan
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {filteredCustomers.length} pelanggan terdaftar dalam sistem
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {search ? "Tidak ada pelanggan yang cocok" : "Belum ada pelanggan terdaftar"}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {search
                  ? "Coba gunakan kata kunci pencarian nama atau nomor telepon yang lain."
                  : "Pelanggan otomatis terdaftar saat Anda membuat kartu loyalitas pertama kali."}
              </p>
              {!search && (
                <div className="pt-2">
                  <Link
                    href="/admin/cards/new"
                    className="inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-blue-900 text-white hover:bg-blue-950 h-11 sm:h-9 px-3.5"
                  >
                    Buat Kartu Pertama
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold">
                    <th className="pb-3 px-3">Nama Pelanggan</th>
                    <th className="pb-3 px-3">Nomor Telepon</th>
                    <th className="pb-3 px-3">Terdaftar</th>
                    <th className="pb-3 px-3">Status Kartu</th>
                    <th className="pb-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredCustomers.map((customer) => {
                    const card = customer.cards?.[0];
                    const isCompleted = card?.status === "completed";

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span>{customer.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {customer.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{customer.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(customer.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {card ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                                  isCompleted
                                    ? "bg-blue-900/10 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-900/20"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {isCompleted ? "Siap Tukar" : "Aktif"}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                ({card.stamps_count}/{card.stamps_required} stempel)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 dark:text-slate-400">Tidak ada kartu</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {card ? (
                            <Link
                              href={`/admin/cards/${card.id}`}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 h-11 sm:h-8 px-3 gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" />
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
