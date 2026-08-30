"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections, platformAdminNavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";

const ADMIN_ONLY_HREFS = ["/equipe", "/audit"];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  showPlatformAdmin?: boolean;
  showAdminNav?: boolean;
}

export function Sidebar({
  mobileOpen,
  onClose,
  showPlatformAdmin = false,
  showAdminNav = true,
}: SidebarProps) {
  const pathname = usePathname();
  const baseSections = showAdminNav
    ? navSections
    : navSections.map((section) => ({
        ...section,
        items: section.items.filter((item) => !ADMIN_ONLY_HREFS.includes(item.href)),
      }));
  const sections = showPlatformAdmin
    ? [...baseSections, platformAdminNavSection]
    : baseSections;

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-brand-600">
          <Image
            src="/logo-mark.png"
            alt=""
            width={28}
            height={28}
            unoptimized
            className="rounded-lg"
          />
          BYA Flow
        </Link>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 lg:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
