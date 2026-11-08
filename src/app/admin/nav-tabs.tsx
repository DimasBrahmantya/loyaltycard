"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  CreditCard,
  Users,
  History,
  Settings,
  UserCheck,
} from "lucide-react";

interface AdminNavTabsProps {
  isOwner: boolean;
}

export function AdminNavTabs({ isOwner }: AdminNavTabsProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
    { href: "/admin/scan", label: "Scan QR", icon: QrCode, exact: false },
    { href: "/admin/cards", label: "Kartu", icon: CreditCard, exact: false },
    { href: "/admin/customers", label: "Pelanggan", icon: Users, exact: false },
    { href: "/admin/history", label: "Riwayat", icon: History, exact: false },
    ...(isOwner
      ? [
          { href: "/admin/settings", label: "Pengaturan", icon: Settings, exact: false },
          { href: "/admin/staff", label: "Staff", icon: UserCheck, exact: false },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Navigasi Menu Admin"
      className="max-w-6xl mx-auto flex items-center space-x-1 px-4 sm:px-6 overflow-x-auto border-t border-slate-200 dark:border-slate-800 py-1.5 scrollbar-none"
    >
      {navLinks.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 px-3 min-h-11 sm:min-h-9 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              isActive
                ? "bg-blue-900/10 text-blue-950 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-blue-900 dark:text-blue-400" : "text-slate-400"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

