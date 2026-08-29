"use client";

import { Bell, LogOut, Menu, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/lib/actions/auth";

interface TopbarProps {
  onMenuClick: () => void;
  userEmail: string;
  organizationName: string;
  unreadNotifications: number;
}

export function Topbar({
  onMenuClick,
  userEmail,
  organizationName,
  unreadNotifications,
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <button
        onClick={onMenuClick}
        className="text-slate-500 hover:text-slate-700 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Rechercher..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      <div className="relative ml-auto flex items-center gap-4">
        <Link
          href="/notifications"
          className="relative text-slate-500 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>

        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {organizationName.charAt(0).toUpperCase() || "B"}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            {organizationName}
          </span>
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <p className="truncate px-2 py-1.5 text-xs text-slate-500">{userEmail}</p>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
