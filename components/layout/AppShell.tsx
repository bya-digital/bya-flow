"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  children: ReactNode;
  userEmail: string;
  organizationName: string;
  unreadNotifications: number;
  showPlatformAdmin?: boolean;
  showAdminNav?: boolean;
  stores: { id: string; name: string }[];
  currentStoreId: string | null;
}

export function AppShell({
  children,
  userEmail,
  organizationName,
  unreadNotifications,
  showPlatformAdmin = false,
  showAdminNav = true,
  stores,
  currentStoreId,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        showPlatformAdmin={showPlatformAdmin}
        showAdminNav={showAdminNav}
      />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          userEmail={userEmail}
          organizationName={organizationName}
          unreadNotifications={unreadNotifications}
          stores={stores}
          currentStoreId={currentStoreId}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
