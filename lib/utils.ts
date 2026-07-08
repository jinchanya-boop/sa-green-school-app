import { type ScoreGrade } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Calculate score grade based on percentage */
export function calculateGrade(percentage: number): ScoreGrade {
  if (percentage >= 90) return "gold";
  if (percentage >= 80) return "silver";
  if (percentage >= 70) return "bronze";
  if (percentage >= 60) return "pass";
  return "fail";
}

/** Grade display in Thai */
export const GRADE_LABELS: Record<ScoreGrade, string> = {
  gold: "ทอง",
  silver: "เงิน",
  bronze: "ทองแดง",
  pass: "ผ่าน",
  fail: "ไม่ผ่าน",
};

/** Grade colors */
export const GRADE_COLORS: Record<ScoreGrade, string> = {
  gold: "#F59E0B",
  silver: "#94A3B8",
  bronze: "#B45309",
  pass: "#22C55E",
  fail: "#EF4444",
};

/** Grade background classes */
export const GRADE_BG: Record<ScoreGrade, string> = {
  gold: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
  silver:
    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  bronze:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
  pass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400",
  fail: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
};

/** Format Thai Buddhist Era date */
export function formatThaiDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("th-TH", {
    calendar: "buddhist",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

/** Format Thai Buddhist Era short date */
export function formatThaiDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("th-TH", {
    calendar: "buddhist",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** User role labels in Thai */
export const ROLE_LABELS: Record<string, string> = {
  administrator: "ผู้ดูแลระบบ",
  director: "ผู้อำนวยการ",
  deputy_director: "รองผู้อำนวยการ",
  building_supervisor: "หัวหน้าอาคาร",
  grade_supervisor: "หัวหน้าระดับชั้น",
  homeroom_teacher: "ครูประจำชั้น",
  student_council: "นักเรียนสภา",
  class_representative: "ตัวแทนห้องเรียน",
  student: "นักเรียน",
  guest: "ผู้เยี่ยมชม",
};

/** Evaluation status labels in Thai */
export const STATUS_LABELS: Record<string, string> = {
  draft: "รอการประเมิน",
  submitted: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  acknowledged: "รับทราบแล้ว",
};

/** Evaluation status colors */
export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  submitted: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  acknowledged: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/** Generate QR code data for certificate */
export function generateCertificateQRData(certificateId: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/verify/${certificateId}`;
}

/** Supabase storage URL helper */
export function getStorageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
