"use client";

import { motion } from "framer-motion";
import { TrendingUp, LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  trend?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  gradientFrom,
  gradientTo,
  trend,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative overflow-hidden rounded-[20px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default"
    >
      {/* Playful Background Glow */}
      <div
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-gradient-to-br ${gradientFrom} ${gradientTo} blur-2xl group-hover:opacity-40 transition-opacity duration-300`}
      />
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className={`p-3 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-sm`}
          >
            <Icon className="w-6 h-6 text-white drop-shadow-sm" />
          </motion.div>
          
          {trend && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.3, type: "spring" }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {trend}
            </motion.span>
          )}
        </div>
        
        <div>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
            {value}
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {label}
          </p>
        </div>
      </div>
      
      {/* Decorative Bottom Line */}
      <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  );
}
