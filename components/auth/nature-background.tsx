"use client";

import { motion } from "framer-motion";
import { Cloud, Bird, TreePine, TreeDeciduous, Leaf, Sparkles, Smile } from "lucide-react";
import { useEffect, useState } from "react";

export function NatureBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Generate random leaves
  const leaves = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 10,
    scale: 0.5 + Math.random() * 0.5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-br from-green-50 via-emerald-50/80 to-blue-50/50">
      
      {/* Sun / Glow */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.4, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-96 h-96 bg-yellow-200/40 rounded-full blur-[100px]"
      />

      {/* Clouds */}
      <motion.div
        animate={{ x: [0, 1000] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-24 -left-32 text-white/80 drop-shadow-sm"
      >
        <Cloud className="w-32 h-32 fill-white" />
      </motion.div>
      <motion.div
        animate={{ x: [0, 1500] }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear", delay: -20 }}
        className="absolute top-40 -left-48 text-white/70 drop-shadow-sm"
      >
        <Cloud className="w-48 h-48 fill-white" />
      </motion.div>
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear", delay: -10 }}
        className="absolute top-16 -right-32 text-white/60 drop-shadow-sm"
      >
        <Cloud className="w-24 h-24 fill-white" />
      </motion.div>

      {/* Birds */}
      <motion.div
        animate={{ x: [-100, 2000], y: [0, -50, 20, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-32 left-0 text-sky-300"
      >
        <Bird className="w-8 h-8 fill-sky-200 opacity-60" />
      </motion.div>
      <motion.div
        animate={{ x: [-100, 2000], y: [0, 30, -20, 10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute top-28 left-4 text-sky-400"
      >
        <Bird className="w-6 h-6 fill-sky-200 opacity-50" />
      </motion.div>

      {/* Trees at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-between px-[10%] opacity-40">
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "bottom center" }}
        >
          <TreePine className="w-48 h-48 text-emerald-600 fill-emerald-500/20" strokeWidth={1} />
        </motion.div>
        
        <motion.div
          animate={{ rotate: [1, -1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ transformOrigin: "bottom center" }}
        >
          <TreeDeciduous className="w-40 h-40 text-green-600 fill-green-500/20" strokeWidth={1} />
        </motion.div>

        <motion.div
          animate={{ rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ transformOrigin: "bottom center" }}
          className="hidden md:block"
        >
          <TreePine className="w-56 h-56 text-teal-600 fill-teal-500/20" strokeWidth={1} />
        </motion.div>
      </div>

      {/* Floating Leaves */}
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          initial={{ y: -50, x: `${leaf.x}vw`, rotate: 0, opacity: 0 }}
          animate={{
            y: ["-10vh", "110vh"],
            x: [`${leaf.x}vw`, `${leaf.x + (Math.random() * 20 - 10)}vw`],
            rotate: [0, 360],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "linear",
          }}
          className="absolute top-0 text-emerald-500/40"
        >
          <Leaf className="w-6 h-6 fill-emerald-400/20" style={{ transform: `scale(${leaf.scale})` }} />
        </motion.div>
      ))}

      {/* Eco Mascot (Sprout/Smile) */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-12 right-[15%] hidden lg:flex flex-col items-center justify-center pointer-events-auto cursor-pointer group"
      >
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-green-300 to-emerald-500 rounded-[40%] shadow-lg flex items-center justify-center">
            <Smile className="w-12 h-12 text-white fill-white/20" />
          </div>
          <Leaf className="absolute -top-4 -right-2 w-8 h-8 text-emerald-600 fill-emerald-400 transform rotate-45" />
          <Sparkles className="absolute -top-6 -left-4 w-6 h-6 text-yellow-400 fill-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="mt-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm text-sm font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          สวัสดี! มารักษ์โลกด้วยกันนะ 🌍
        </div>
      </motion.div>
    </div>
  );
}
