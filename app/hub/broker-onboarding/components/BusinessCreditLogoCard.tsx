"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { resizeImageFile } from "@/lib/client/resize-image";

const MAX_WIDTH = 600;
const MAX_HEIGHT = 240;

export default function BusinessCreditLogoCard() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/business-credit-intake/logo", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setLogoUrl(data.url);
      } catch {
        // silencioso — no es crítico si no carga la vista previa
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Solo se aceptan imágenes JPG o PNG.");
      return;
    }

    setError("");
    setSuccess(false);
    setIsUploading(true);
    try {
      const resized = await resizeImageFile(file, MAX_WIDTH, MAX_HEIGHT);
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("logo", resized, file.name);
      const res = await fetch("/api/business-credit-intake/logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo subir el logo.");
        return;
      }
      setLogoUrl(URL.createObjectURL(resized));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch {
      setError("No se pudo subir el logo. Intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setIsUploading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/business-credit-intake/logo", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setLogoUrl(null);
    } catch {
      setError("No se pudo quitar el logo. Intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#0A182D]/60 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <ImageIcon size={18} className="text-cyan-400" />
            <span>Logo para el Business Credit Program</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Se usa solo en el formulario público que le mandas a tus clientes para tramitar su DUNS. Si no subes uno, se muestra el logo de Emprende 360.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="w-full sm:w-auto flex-1 flex items-center justify-center p-6 rounded-2xl bg-[#05101F] border border-gray-800 min-h-[120px]">
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-gray-500" />
          ) : logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Tu logo" className="max-h-20 max-w-full object-contain" />
          ) : (
            <p className="text-xs text-gray-500">Todavía no has subido un logo</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleFileChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span>{logoUrl ? "Cambiar logo" : "Subir logo"}</span>
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="px-4 py-2 bg-[#05101F] hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>Quitar logo</span>
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          <span>Logo actualizado.</span>
        </p>
      )}
      <p className="text-[10px] text-gray-500">
        JPG o PNG — se redimensiona automáticamente a un máximo de {MAX_WIDTH}×{MAX_HEIGHT}px antes de subirse.
      </p>
    </div>
  );
}
