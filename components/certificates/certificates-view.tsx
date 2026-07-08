"use client";

import { motion } from "framer-motion";
import { Award, Download, QrCode, Star } from "lucide-react";
import { formatThaiDate, GRADE_BG } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cert = Record<string, any>;

export function CertificatesView({ certificates }: { certificates: unknown[] }) {
  const certs = certificates as Cert[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950 rounded-xl flex items-center justify-center">
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">เกียรติบัตร</h1>
            <p className="text-gray-400 text-sm">โมดูล F — เกียรติบัตรด้านสิ่งแวดล้อม</p>
          </div>
        </div>
      </div>

      {certs.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-20 text-gray-400">
          <Award className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">ยังไม่มีเกียรติบัตร</p>
          <p className="text-sm mt-1">เกียรติบัตรจะออกอัตโนมัติเมื่อผ่านเกณฑ์ประเมิน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {certs.map((cert) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="stat-card group"
            >
              {/* Certificate Card Header */}
              <div className={`-mx-6 -mt-6 mb-4 px-6 py-4 rounded-t-2xl ${
                cert.grade === "gold"
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                  : cert.grade === "silver"
                  ? "bg-gradient-to-r from-slate-400 to-slate-500"
                  : "bg-gradient-to-r from-orange-600 to-orange-700"
              }`} style={{ margin: "-1.5rem -1.5rem 1rem" }}>
                <div className="flex items-center justify-between">
                  <Star className="w-8 h-8 text-white/80" />
                  <span className={`text-sm font-bold px-2 py-1 rounded-lg bg-white/20 text-white`}>
                    {cert.grade === "gold" ? "ระดับทอง" : cert.grade === "silver" ? "ระดับเงิน" : "ระดับทองแดง"}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {cert.homeroom?.class_name ?? "—"}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  คะแนน: {cert.total_score?.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ออกเมื่อ: {cert.issued_at ? formatThaiDate(cert.issued_at) : "—"}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-50 dark:hover:bg-green-950 transition-colors">
                  <Download className="w-4 h-4" />
                  ดาวน์โหลด PDF
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
