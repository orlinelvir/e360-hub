"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-[#030812] text-white flex items-center justify-center min-h-screen">
        <div className="text-center px-6">
          <h2 className="text-2xl font-bold mb-4">Error cr\u00edtico</h2>
          <p className="text-gray-400 mb-6">La aplicaci\u00f3n encontr\u00f3 un error inesperado.</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-sm"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
