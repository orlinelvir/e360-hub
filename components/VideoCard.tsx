"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface VideoCardProps {
  src: string;
  index: number;
}

export default function VideoCard({ src, index }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef(null);
  // Detectamos si el video está en el viewport (especialmente para móvil)
  const isInView = useInView(containerRef, { amount: 0.6 });
  const [isPlaying, setIsPlaying] = useState(false);

  // Manejo de reproducción/pausa basado en visibilidad (Móvil/Scroll) y Hover (Desktop)
  useEffect(() => {
    if (!videoRef.current) return;

    if (isInView) {
      videoRef.current.play().catch(() => {
        // Manejar bloqueo de auto-play por el navegador si fuera necesario
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isInView]);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    // Solo pausamos en desktop si no está "en vista" de forma forzada o si preferimos que solo sea por hover
    // Pero para una mejor UX, si el mouse sale, pausamos a menos que queramos que siga por scroll
    if (videoRef.current && !isInView) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-gray-800 bg-gray-900 group cursor-pointer"
    >
      <video 
        ref={videoRef}
        loop 
        muted 
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
          isPlaying ? "grayscale-0 scale-105" : "grayscale opacity-60 scale-100"
        }`}
      >
        <source src={src} type="video/mp4" />
      </video>
      
      {/* Overlay sutil para mejorar el contraste */}
      <div className={`absolute inset-0 bg-gradient-to-t from-[#030812]/80 via-transparent to-transparent transition-opacity duration-500 ${
        isPlaying ? "opacity-40" : "opacity-80"
      }`} />

      {/* Indicador visual de "Click para sonido" o simplemente estado */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
      )}
    </motion.div>
  );
}
