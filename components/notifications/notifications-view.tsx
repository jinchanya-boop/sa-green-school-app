"use client";

import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notif = Record<string, any>;

const TYPE_ICONS: Record<string, string> = {
  evaluation_submitted: "📋",
  evaluation_approved: "✅",
  evaluation_rejected: "❌",
  ranking_change: "🏆",
  certificate_issued: "🎖️",
  system: "🔔",
};

export function NotificationsView({ notifications }: { notifications: unknown[] }) {
  const notifs = notifications as Notif[];
  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-red-500" />
            </div>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">การแจ้งเตือน</h1>
            <p className="text-gray-400 text-sm">
              {unread > 0 ? `${unread} รายการที่ยังไม่ได้อ่าน` : "อ่านครบทั้งหมดแล้ว"}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <CheckCheck className="w-4 h-4" />
            ทำเครื่องหมายอ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifs.length === 0 ? (
          <div className="stat-card flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">ไม่มีการแจ้งเตือน</p>
            <p className="text-sm mt-1">การแจ้งเตือนจะปรากฏที่นี่</p>
          </div>
        ) : (
          notifs.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors group ${
                n.is_read
                  ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                  : "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900"
              }`}
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">
                {TYPE_ICONS[n.type] ?? "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${n.is_read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.body}</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5">
                  {n.created_at ? new Date(n.created_at).toLocaleString("th-TH") : ""}
                </p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
              )}
              <button className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
