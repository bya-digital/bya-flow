"use client";

import { Bell, Check } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div>
      {unreadCount > 0 && (
        <form action={markAllNotificationsRead} className="mb-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
          >
            <Check className="h-4 w-4" />
            Tout marquer comme lu ({unreadCount})
          </button>
        </form>
      )}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={`flex items-start gap-3 p-4 ${
              notification.read_at ? "" : "bg-brand-50/50"
            }`}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100">
              <Bell className="h-4 w-4 text-brand-600" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{notification.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(notification.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
            {!notification.read_at && (
              <form action={markNotificationRead}>
                <input type="hidden" name="notificationId" value={notification.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Marquer comme lu
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
