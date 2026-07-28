"use client";

import { motion } from "framer-motion";
import { Award, Download, QrCode, Crown, Sparkles, MapPin, School, Droplets, CheckCircle2, Lock, Trophy } from "lucide-react";
import { formatThaiDate } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cert = Record<string, any>;
import { MyCertificatesClient } from "@/components/certificate-center/my-certificates-client";

const ACHIEVEMENT_CATALOG = [
  {
    id: "area_gold",
    title: "เขตพื้นที่รับผิดชอบดีเด่น",
    description: "ได้รับเกียรติบัตรระดับทอง (ร้อยละ 90 ขึ้นไป)",
    rarity: "legendary",
    color: "from-amber-400 to-yellow-600",
    glowColor: "shadow-yellow-500/60",
    icon: MapPin,
    check: (certs: Cert[]) => certs.some(c => c.area_score >= 90)
  },
  {
    id: "classroom_gold",
    title: "ห้องเรียนดีเด่น",
    description: "ได้รับเกียรติบัตรระดับทอง (ร้อยละ 90 ขึ้นไป)",
    rarity: "legendary",
    color: "from-amber-400 to-yellow-600",
    glowColor: "shadow-yellow-500/60",
    icon: School,
    check: (certs: Cert[]) => certs.some(c => c.classroom_score >= 90)
  },
  {
    id: "water_pass",
    title: "ยอดเยี่ยมด้านแก้วน้ำส่วนตัว",
    description: "สถิติการพกแก้วน้ำเฉลี่ยเกินร้อยละ 80",
    rarity: "legendary",
    color: "from-blue-400 to-cyan-600",
    glowColor: "shadow-cyan-500/60",
    icon: Droplets,
    check: (certs: Cert[]) => certs.some(c => c.water_score > 80)
  }
];

export function CertificatesView({ 
  certificates,
  certCenterCerts = []
}: { 
  certificates: unknown[],
  certCenterCerts?: any[]
}) {
  const certs = certificates as Cert[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">คลังความสำเร็จ (Achievements)</h1>
            <p className="text-gray-500 font-medium text-sm">สะสมเข็มกลัดเกียรติยศ และเกียรติบัตรทั้งหมดของคุณ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {ACHIEVEMENT_CATALOG.map((achievement, index) => {
          const isUnlocked = achievement.check(certs);
          const Icon = achievement.icon;
          const isLegendary = achievement.rarity === "legendary" || achievement.rarity === "mythic";
          const isRare = achievement.rarity === "rare" || achievement.rarity === "epic";

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              whileHover={{ scale: isUnlocked ? 1.05 : 1.02, y: isUnlocked ? -5 : 0 }}
              className={`relative group perspective-1000 h-[260px] sm:h-[300px] w-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${
                isUnlocked 
                  ? `shadow-xl ${achievement.glowColor}` 
                  : "grayscale opacity-60 hover:grayscale-[50%] hover:opacity-80 border-2 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-none"
              }`}
            >
              {/* Card Background for Unlocked */}
              {isUnlocked && (
                <div className={`absolute inset-0 bg-gradient-to-b ${achievement.color} z-0 opacity-90`} />
              )}
              {isUnlocked && (
                <div className={`absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent z-0`} />
              )}

              {/* Shimmer Effect for Rare/Legendary */}
              {isUnlocked && (isRare || isLegendary) && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
                </div>
              )}

              {/* Sparkles for Legendary */}
              {isUnlocked && isLegendary && (
                <div className="absolute inset-0 z-0 bg-[url('/sparkle-pattern.png')] bg-cover opacity-30 animate-pulse" />
              )}

              <div className="relative z-10 flex flex-col h-full p-4 sm:p-5 items-center justify-between text-center">
                {/* Rarity Label */}
                <div className="w-full flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isUnlocked ? "bg-black/20 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-500"
                  }`}>
                    {achievement.rarity}
                  </span>
                  {!isUnlocked && <Lock className="w-3 h-3 text-gray-400" />}
                </div>

                {/* Main Icon */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-inner mb-4 transition-transform duration-500 ${
                  isUnlocked ? "bg-white/20 backdrop-blur-md group-hover:rotate-12 group-hover:scale-110" : "bg-gray-200 dark:bg-gray-800"
                }`}>
                  <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${isUnlocked ? "text-white drop-shadow-lg" : "text-gray-400"}`} />
                </div>

                {/* Text Content */}
                <div className="mt-auto w-full">
                  <h3 className={`font-black text-sm sm:text-base leading-tight mb-1 ${isUnlocked ? "text-white text-shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-[10px] sm:text-xs leading-tight ${isUnlocked ? "text-white/80" : "text-gray-400 dark:text-gray-500"}`}>
                    {achievement.description}
                  </p>
                </div>

                {/* Unlocked Date / Badge */}
                {isUnlocked && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full h-full bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mb-2 drop-shadow-lg" />
                    <span className="font-black text-white">ปลดล็อกแล้ว</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-8 mt-12 border-t-2 border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Download className="w-5 h-5" /> เกียรติบัตรของฉัน (My Certificates)
        </h2>
        <MyCertificatesClient initialCertificates={certCenterCerts} hideTitle={true} />
      </div>
    </motion.div>
  );
}
