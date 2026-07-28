"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Award, FileImage, FileSignature, Layers, ShieldCheck, QrCode } from "lucide-react";

interface CertificateCenterDashboardProps {
  userRole: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function CertificateCenterDashboard({ userRole }: CertificateCenterDashboardProps) {
  const isStudent = userRole === "student";
  const isAdmin = userRole === "administrator";
  const isTeacherOrDirector = ["homeroom_teacher", "director", "deputy_director", "building_supervisor", "grade_supervisor"].includes(userRole);

  const adminMenu = [
    {
      title: "แม่แบบเกียรติบัตร",
      description: "จัดการภาพพื้นหลังและกำหนดตำแหน่งข้อความบนเกียรติบัตร",
      icon: FileImage,
      href: "/certificate-center/templates",
      color: "from-purple-500 to-fuchsia-500",
      bg: "bg-purple-50 dark:bg-purple-950",
      text: "text-purple-600",
    },
    {
      title: "จัดการเลขที่เกียรติบัตร",
      description: "นำเข้าและสร้างชุดเลขที่เกียรติบัตรที่ได้รับการอนุมัติจากฝ่ายวิชาการ",
      icon: Layers,
      href: "/certificate-center/numbers",
      color: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-600",
    }
  ];

  const teacherMenu = [
    {
      title: "ออกเกียรติบัตร",
      description: "เลือกแม่แบบและนักเรียนเพื่อสร้างเกียรติบัตรอัตโนมัติ",
      icon: FileSignature,
      href: "/certificate-center/issue",
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      text: "text-emerald-600",
    }
  ];

  const studentMenu = [
    {
      title: "เกียรติบัตรของฉัน",
      description: "ดูและดาวน์โหลดเกียรติบัตรทั้งหมดที่คุณได้รับ",
      icon: Award,
      href: "/certificate-center/my-certificates",
      color: "from-amber-400 to-orange-500",
      bg: "bg-amber-50 dark:bg-amber-950",
      text: "text-amber-600",
    }
  ];

  const publicMenu = [
    {
      title: "ตรวจสอบเกียรติบัตร",
      description: "ตรวจสอบความถูกต้องของเกียรติบัตรด้วย QR Code หรือรหัส",
      icon: ShieldCheck,
      href: "/verify",
      color: "from-slate-500 to-gray-500",
      bg: "bg-slate-50 dark:bg-slate-900",
      text: "text-slate-600",
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/20 dark:to-orange-900/10 rounded-3xl p-6 sm:p-10 border border-amber-200/50 dark:border-amber-900/30 relative overflow-hidden shadow-sm">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                ศูนย์เกียรติบัตรออนไลน์
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
                Certificate Center — จัดการและออกเกียรติบัตรอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Render Admin Menu (Templates & Numbers) */}
        {isAdmin && adminMenu.map((item, index) => (
          <motion.div variants={itemVariants} key={`admin-${index}`}>
            <MenuCard {...item} badge="ผู้ดูแลระบบ" />
          </motion.div>
        ))}

        {/* Render Teacher Menu (Issue Certificate) - Now only Admin can issue */}
        {isAdmin && teacherMenu.map((item, index) => (
          <motion.div variants={itemVariants} key={`teacher-${index}`}>
            <MenuCard {...item} badge="ผู้ดูแลระบบ" />
          </motion.div>
        ))}

        {/* Render Student/Teacher Menu (My Certificates) */}
        {(isStudent || isTeacherOrDirector || isAdmin || userRole === "guest") && studentMenu.map((item, index) => (
          <motion.div variants={itemVariants} key={`student-${index}`}>
            <MenuCard {...item} badge={isStudent ? "นักเรียน" : isTeacherOrDirector ? "ครู / ผู้บริหาร" : "ผู้ดูแลระบบ"} />
          </motion.div>
        ))}

        {/* Public Menu */}
        {publicMenu.map((item, index) => (
          <motion.div variants={itemVariants} key={`public-${index}`}>
            <MenuCard {...item} badge="สาธารณะ" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function MenuCard({ title, description, icon: Icon, href, color, bg, text, badge }: any) {
  return (
    <Link href={href} className="block group h-full">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden h-full flex flex-col group-hover:-translate-y-1">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={`w-14 h-14 ${bg} ${text} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
            <Icon className="w-7 h-7" />
          </div>
          {badge && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-1 rounded-full uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        
        <div className="relative z-10 mt-auto">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
