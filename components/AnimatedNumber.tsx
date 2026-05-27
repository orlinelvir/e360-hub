"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedNumberProps {
  end: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export default function AnimatedNumber({ end, prefix = "", suffix = "", delay = 0 }: AnimatedNumberProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const duration = 2000; // La animación dura 2 segundos

      const animateNumber = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsedTime = currentTime - startTime;

        if (elapsedTime < delay * 1000) {
          requestAnimationFrame(animateNumber);
          return;
        }

        const adjustedTime = elapsedTime - (delay * 1000);
        if (adjustedTime < duration) {
          const progress = adjustedTime / duration;
          const easeOut = progress * (2 - progress); // Curva suave para que frene al final
          setCount(Math.floor(easeOut * end));
          requestAnimationFrame(animateNumber);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animateNumber);
    }
  }, [isInView, end, delay]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}
