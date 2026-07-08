import type { Metadata } from "next";
import { AIAnalyticsView } from "@/components/ai/ai-analytics-view";

export const metadata: Metadata = {
  title: "AI วิเคราะห์สิ่งแวดล้อม",
  description: "วิเคราะห์แนวโน้มและข้อเสนอแนะด้านสิ่งแวดล้อมด้วย AI",
};

export default function AIAnalyticsPage() {
  return <AIAnalyticsView />;
}
