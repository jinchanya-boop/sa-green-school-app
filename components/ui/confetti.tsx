"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SHAPES = ["✨", "🎉", "🌟", "🏆", "🎊"];
const COLORS = ["#FFD700", "#FF8C00", "#FF1493", "#00BFFF", "#32CD32"];

export function Confetti({ count = 30 }: { count?: number }) {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial pieces
    const newPieces = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage string
      delay: Math.random() * 2,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);
  }, [count]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            y: "-10vh",
            x: `${p.x}vw`,
            rotate: p.rotation,
            scale: p.scale,
            opacity: 1,
          }}
          animate={{
            y: "110vh",
            x: `${p.x + (Math.random() * 10 - 5)}vw`,
            rotate: p.rotation + 360 * 2,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: p.delay,
            ease: "linear",
            repeat: Infinity,
          }}
          className="absolute text-2xl"
          style={{ color: p.color }}
        >
          {p.shape}
        </motion.div>
      ))}
    </div>
  );
}
