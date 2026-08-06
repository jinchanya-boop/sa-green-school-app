"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { type Profile } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  profile: Profile | null;
  unreadCount?: number;
}

export function DashboardShell({ children, profile, unreadCount = 0 }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 print:bg-white print:h-auto print:overflow-visible print:block">
      {/* Sidebar */}
      <Sidebar
        collapsed={!sidebarOpen && !mobileOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        profile={profile}
        unreadCount={unreadCount}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 print:block print:overflow-visible print:m-0 print:w-full ${sidebarOpen ? "md:ml-[260px]" : "md:ml-[72px]"}`}>
        <Header
          onToggleSidebar={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setMobileOpen(!mobileOpen);
            } else {
              setSidebarOpen(!sidebarOpen);
            }
          }}
          profile={profile}
          unreadCount={unreadCount}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0 print:overflow-visible print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
