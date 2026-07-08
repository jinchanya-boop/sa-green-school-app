"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  School,
  Droplets,
  BarChart3,
  Award,
  Bell,
  BrainCircuit,
  Settings,
  Leaf,
  ChevronLeft,
  LogOut,
  X,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { type Profile } from "@/types";
import { ROLE_LABELS } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "แดชบอร์ด",
    icon: LayoutDashboard,
  },
  {
    href: "/area-evaluation",
    label: "ประเมินพื้นที่รับผิดชอบ",
    icon: MapPin,
    roles: ["administrator", "director", "deputy_director", "grade_supervisor", "student_council", "class_representative"],
  },
  {
    href: "/classroom-eval",
    label: "ประเมินความสะอาดห้องเรียน",
    icon: School,
    roles: ["administrator", "director", "deputy_director", "building_supervisor", "student_council", "class_representative"],
  },
  {
    href: "/water-bottle",
    label: "ติดตามแก้วน้ำส่วนตัว",
    icon: Droplets,
    roles: ["administrator", "director", "deputy_director", "grade_supervisor", "homeroom_teacher"],
  },
  {
    href: "/reports",
    label: "รายงาน",
    icon: BarChart3,
    roles: ["administrator", "director", "deputy_director", "building_supervisor", "grade_supervisor", "homeroom_teacher"],
  },
  {
    href: "/certificates",
    label: "เกียรติบัตร",
    icon: Award,
  },
  {
    href: "/rankings",
    label: "การจัดอันดับ",
    icon: Trophy,
  },
  {
    href: "/notifications",
    label: "การแจ้งเตือน",
    icon: Bell,
  },
  {
    href: "/ai-analytics",
    label: "AI วิเคราะห์",
    icon: BrainCircuit,
    roles: ["administrator", "director", "deputy_director"],
    badge: "AI",
  },
  {
    href: "/students",
    label: "จัดการนักเรียน",
    icon: Users,
    roles: ["administrator", "grade_supervisor"],
  },
  {
    href: "/settings",
    label: "ตั้งค่าระบบ",
    icon: Settings,
    roles: ["administrator"],
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  profile: Profile | null;
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose, profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const userRoles = new Set<string>();
  if (profile?.role) userRoles.add(profile.role);
  if (profile?.grade_level) userRoles.add("grade_supervisor");
  if (profile?.building_id) userRoles.add("building_supervisor");
  if (profile?.homeroom_id) userRoles.add("homeroom_teacher");

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.some(r => userRoles.has(r))
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800 ${collapsed ? "justify-center" : ""}`}>
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sa School Logo" className="w-full h-full object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                โรงเรียนสา
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                Sa Green School
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {filteredNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${collapsed ? "justify-center" : ""}
                ${
                  isActive
                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              <div className={`flex-shrink-0 transition-colors ${isActive ? "text-green-600 dark:text-green-400" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 truncate"
                  >
                    {profile?.role === "class_representative" && item.href === "/area-evaluation" 
                      ? "รายงานเขตพื้นที่" 
                      : profile?.role === "class_representative" && item.href === "/classroom-eval" 
                        ? "รายงานห้องเรียน" 
                        : item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && item.badge && (
                <span className="text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute left-0 w-0.5 h-6 bg-green-600 rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={`border-t border-gray-100 dark:border-gray-800 p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-green-200 dark:border-green-800"
                />
              ) : (
                <div className="w-9 h-9 rounded-full gradient-green flex items-center justify-center text-white text-sm font-bold">
                  {profile?.full_name?.charAt(0) ?? "U"}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {profile?.full_name ?? "ผู้ใช้งาน"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {profile?.role ? ROLE_LABELS[profile.role] : "ผู้เยี่ยมชม"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30
          bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
          shadow-sm transition-all duration-300
          ${collapsed ? "w-[72px]" : "w-[260px]"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-50 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col md:hidden"
          >
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
