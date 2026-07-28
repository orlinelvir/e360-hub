import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h1 className="text-6xl font-extrabold text-cyan-400 mb-4">404</h1>
      <h2 className="text-xl font-bold text-white mb-2">P\u00e1gina no encontrada</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-md">
        La p\u00e1gina que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition-all"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
