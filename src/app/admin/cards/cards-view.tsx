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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="search"
            placeholder="Cari nama atau no. telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-900"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium">
          <Filter className="w-3.5 h-3.5 ml-2 mr-1 text-zinc-500" />
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Semua ({initialCards.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === "active"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === "completed"
                ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Siap Ditukar
          </button>
        </div>
      </div>

      {/* Cards List / Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <CreditCard className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {initialCards.length === 0
              ? "Belum ada kartu loyalitas"
              : "Tidak ada kartu yang cocok"}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
            {initialCards.length === 0
              ? "Mulai buat kartu loyalitas pertama untuk pelanggan usaha Anda."
              : "Coba ubah kata kunci pencarian atau filter status kartu."}
          </p>
          {initialCards.length === 0 && (
            <Link href="/admin/cards/new">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Buat Kartu Baru
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const isCompleted = card.status === "completed";
            const progressPercent = Math.min(
              100,
              Math.round((card.stamps_count / card.stamps_required) * 100)
            );

            return (
              <Link
                key={card.id}
                href={`/admin/cards/${card.id}`}
                className="group block p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-800/60 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-base group-hover:text-orange-600 transition">
                      {card.customer?.name || "Pelanggan Tanpa Nama"}
                    </h4>
                    {card.customer?.phone && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{card.customer.phone}</span>
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                      isCompleted
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Award className="w-3 h-3 text-amber-600" />
                        Siap Ditukar
                      </>
                    ) : (
                      "Aktif"
                    )}
                  </span>
                </div>

                {/* Progress bar and count */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>Kemajuan Stempel</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {card.stamps_count} / {card.stamps_required}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-amber-500"
                          : "bg-orange-600 dark:bg-orange-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Siklus ke-{card.current_cycle}
                  </span>
                  <span className="flex items-center font-medium text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform">
                    Buka
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

