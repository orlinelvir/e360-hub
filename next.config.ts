import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Un package-lock.json huérfano en la carpeta padre ("E360 Website/") hace que
    // Turbopack infiera mal la raíz del workspace. Se fija explícitamente aquí.
    root: import.meta.dirname,
  },
  // firebase-admin/auth carga jwks-rsa, que a su vez hace require() del build ESM-only
  // de jose (dist/webapi/index.js). El bundler de Turbopack para Vercel intenta cargar
  // ese árbol como "external module" y falla con ERR_REQUIRE_ESM en producción (no se
  // reproduce en local). Forzar estos paquetes como externos hace que Node los resuelva
  // nativamente en runtime, respetando el "exports" map real de cada uno.
  serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
