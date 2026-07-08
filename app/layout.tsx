import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sa Green School | ระบบจัดการสิ่งแวดล้อมโรงเรียนสา",
    template: "%s | โรงเรียนสา",
  },
  description:
    "ระบบบริหารจัดการสิ่งแวดล้อมโรงเรียนสา — ประเมินพื้นที่รับผิดชอบ ความสะอาดห้องเรียน และการใช้แก้วน้ำส่วนตัว",
  keywords: ["โรงเรียนสา", "สิ่งแวดล้อม", "green school", "sa school", "น่าน"],
  authors: [{ name: "Sa School" }],
  creator: "Sa School",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sa Green School",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "th_TH",
    title: "Sa Green School Management System",
    description: "ระบบจัดการสิ่งแวดล้อมโรงเรียนสา",
    siteName: "Sa Green School",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#15803d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning className={sarabun.variable}>
      <body className={sarabun.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
