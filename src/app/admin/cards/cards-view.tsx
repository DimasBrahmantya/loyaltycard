"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  ChevronRight,
  Phone,
  Calendar,
  Award,
  User,
} from "lucide-react";

export interface CardItem {
  id: string;
  public_token: string;
  stamps_count: number;
  stamps_required: number;
  current_cycle: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  customer: {
    name: string;
    phone: string | null;
  } | null;
}

interface CardsViewProps {
  initialCards: CardItem[];
}

export function CardsView({ initialCards }: CardsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  const filteredCards = useMemo(() => {
    return initialCards.filter((card) => {
      const customerName = card.customer?.name?.toLowerCase() || "";
      const customerPhone = card.customer?.phone || "";
      const matchesSearch =
        customerName.includes(searchTerm.toLowerCase().trim()) ||
        customerPhone.includes(searchTerm.trim());

      const matchesStatus =
        statusFilter === "all" ? true : card.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [initialCards, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Cari nama atau no. telepon pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-11 sm:h-10 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <Filter className="w-3.5 h-3.5 ml-2 mr-1 text-slate-400" />
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center min-h-11 sm:min-h-9 px-3 rounded-lg transition ${
              statusFilter === "all"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Semua ({initialCards.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`inline-flex items-center min-h-11 sm:min-h-9 px-3 rounded-lg transition ${
              statusFilter === "active"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`inline-flex items-center min-h-11 sm:min-h-9 px-3 rounded-lg transition ${
              statusFilter === "completed"
                ? "bg-blue-900/10 dark:bg-blue-950/80 text-blue-950 dark:text-blue-300 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Siap Tukar
          </button>
        </div>
      </div>

      {/* Cards List / Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialCards.length === 0
                ? "Belum ada kartu loyalitas pelanggan"
                : "Tidak ada kartu yang cocok"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {initialCards.length === 0
                ? "Buat kartu loyalitas digital pertama untuk pelanggan usaha Anda dan bagikan QR code-nya."
                : "Silakan ubah kata kunci pencarian atau filter status kartu untuk menemukan data."}
            </p>
          </div>
          {initialCards.length === 0 && (
            <div className="pt-2">
              <Link href="/admin/cards/new">
                <Button className="bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Buat Kartu Baru
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const isCompleted = card.status === "completed" || card.stamps_count >= card.stamps_required;
            const progressPercent = Math.min(
              100,
              Math.round((card.stamps_count / card.stamps_required) * 100)
            );

            return (
              <Link
                key={card.id}
                href={`/admin/cards/${card.id}`}
                className="group block p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                        {card.customer?.name || "Pelanggan Tanpa Nama"}
                      </h4>
                    </div>

                    {card.customer?.phone && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1 ml-9">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{card.customer.phone}</span>
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                      isCompleted
                        ? "bg-blue-900/10 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-900/20"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Award className="w-3 h-3 text-blue-900 dark:text-blue-400" />
                        Siap Tukar
                      </>
                    ) : (
                      "Aktif"
                    )}
                  </span>
                </div>

                {/* Progress bar and count */}
                <div className="space-y-1.5 my-3.5">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span>Kemajuan Stempel</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {card.stamps_count} / {card.stamps_required}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-600"
                          : "bg-blue-900 dark:bg-blue-400"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Siklus ke-{card.current_cycle}
                  </span>
                  <span className="flex items-center font-semibold text-blue-900 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    Buka Kasir
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
