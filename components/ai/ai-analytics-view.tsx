"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

const SAMPLE_INSIGHTS = [
  {
    type: "trend",
    icon: TrendingUp,
    color: "text-green-600 bg-green-50 dark:bg-green-950",
    title: "แนวโน้มดีขึ้น",
    content:
      "ห้อง ม.3/2 มีคะแนนสูงขึ้นต่อเนื่อง 3 สัปดาห์ติดต่อกัน เฉลี่ย +4.2% ต่อสัปดาห์ คาดว่าจะถึงระดับทองในอีก 2 สัปดาห์",
  },
  {
    type: "alert",
    icon: AlertTriangle,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    title: "ต้องการความสนใจ",
    content:
      "ห้อง ม.2/1 มีคะแนนแก้วน้ำลดลง 15% ในสัปดาห์ที่ผ่านมา ควรตรวจสอบสาเหตุและให้กำลังใจนักเรียน",
  },
  {
    type: "suggestion",
    icon: Lightbulb,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
    title: "ข้อเสนอแนะ",
    content:
      "อาคาร 2 มีคะแนนความสะอาดต่ำที่สุดในโรงเรียน แนะนำให้จัด Cleaning Day พิเศษในสัปดาห์หน้า",
  },
];

export function AIAnalyticsView() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    // Simulate API call — replace with real Supabase Edge Function call
    await new Promise((r) => setTimeout(r, 1500));
    setResponse(
      `📊 **การวิเคราะห์โดย AI**\n\nจากคำถาม: "${prompt}"\n\nข้อมูลที่วิเคราะห์ครอบคลุม 5 ห้องเรียน ภาคเรียนที่ 1/2567\n\n**สรุปผล:** โรงเรียนสามีพัฒนาการด้านสิ่งแวดล้อมที่ดี โดยเฉพาะในด้านความสะอาดห้องเรียนที่มีคะแนนเฉลี่ย 87.3% ซึ่งอยู่ในระดับเงิน\n\n**ข้อเสนอแนะ:** ควรเน้นการส่งเสริมการใช้แก้วน้ำส่วนตัว โดยสร้างแรงจูงใจเพิ่มเติม เช่น คะแนนพิเศษหรือรางวัลรายสัปดาห์`
    );
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950 rounded-xl flex items-center justify-center">
          <BrainCircuit className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI วิเคราะห์สิ่งแวดล้อม</h1>
          <p className="text-gray-400 text-sm">โมดูล H — ขับเคลื่อนด้วย Gemini AI</p>
        </div>
      </div>

      {/* AI Chat Interface */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">ถามคำถาม AI</h2>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            "วิเคราะห์แนวโน้มคะแนนรายสัปดาห์",
            "ห้องเรียนใดต้องการความช่วยเหลือ?",
            "ทำนายคะแนนสิ้นภาคเรียน",
            "เปรียบเทียบผลระหว่างอาคาร",
          ].map((q) => (
            <button
              key={q}
              onClick={() => setPrompt(q)}
              className="px-3 py-1.5 text-xs font-medium bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="พิมพ์คำถามของคุณ เช่น 'วิเคราะห์แนวโน้มคะแนนเดือนนี้'"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            วิเคราะห์
          </button>
        </div>

        {/* Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-violet-50 dark:bg-violet-950/50 rounded-xl border border-violet-100 dark:border-violet-900 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed"
          >
            {response}
          </motion.div>
        )}
      </div>

      {/* Auto Insights */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
          ข้อมูลเชิงลึกอัตโนมัติ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_INSIGHTS.map((insight) => {
            const Icon = insight.icon;
            return (
              <div key={insight.type} className="stat-card">
                <div className={`inline-flex p-2 rounded-xl mb-3 ${insight.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  {insight.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {insight.content}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
