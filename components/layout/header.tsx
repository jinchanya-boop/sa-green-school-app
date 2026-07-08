"use client";

import { Menu, Bell, Sun, Moon, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { type Profile } from "@/types";

interface HeaderProps {
  onToggleSidebar: () => void;
  profile: Profile | null;
}

export function Header({ onToggleSidebar, profile }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 px-4 md:px-6 sticky top-0 z-20 shadow-sm">
      {/* Toggle Sidebar */}
      <button
        onClick={onToggleSidebar}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        aria-label="สลับเมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        {searchOpen ? (
          <input
            autoFocus
            type="search"
            placeholder="ค้นหา..."
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-sm hover:border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full max-w-xs"
          >
            <Search className="w-4 h-4" />
            <span>ค้นหา...</span>
            <kbd className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Mobile Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Dark Mode Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            aria-label="สลับธีม"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Notifications */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full gradient-green flex items-center justify-center text-white text-sm font-bold overflow-hidden border-2 border-green-200 dark:border-green-800">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            profile?.full_name?.charAt(0) ?? "U"
          )}
        </div>
      </div>
    </header>
  );
}
