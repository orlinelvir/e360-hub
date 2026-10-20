"use client";

import { useEffect, useState } from "react";

/**
 * Altura real (en px) del <header id="hub-main-header"> del Hub — el nav
 * principal también es sticky (top-0, z-40), así que cualquier barra sticky
 * más abajo (filtros, thead) necesita este offset para apilarse justo debajo
 * en vez de quedar tapada por él. Se mide en vivo con ResizeObserver en vez
 * de usar un valor fijo en px, para no romperse si el header cambia de alto
 * (ej. el nav envuelve a dos líneas en mobile).
 */
export function useHubHeaderOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const header = document.getElementById("hub-main-header");
    if (!header) return;

    const update = () => setOffset(header.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return offset;
}
