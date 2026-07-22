import { useState, useCallback } from "react";
import { auth } from "@/lib/firebase";

export interface CRMCredentials {
  locationId?: string;
  apiKey?: string;
}

export function useGHLContacts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (query?: string, credentials?: CRMCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/ghl/contacts", window.location.origin);
      if (query) url.searchParams.append("query", query);

      const headers: HeadersInit = {};
      if (credentials?.locationId) headers["x-crm-location-id"] = credentials.locationId;
      if (credentials?.apiKey) headers["x-crm-api-key"] = credentials.apiKey;

      // Obtener y adjuntar el token de autenticación de Firebase en la cabecera
      // Esto previene fallas si las cookies de sesión son bloqueadas por políticas de privacidad del navegador (ej. Safari en iOS)
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } catch (e) {
          console.warn("No se pudo obtener el token de Firebase Auth para las cabeceras:", e);
        }
      }

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al consultar contactos del CRM.");
      }

      return data.contacts || [];
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor CRM.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createContact = useCallback(async (contactPayload: any, credentials?: CRMCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (credentials?.locationId) headers["x-crm-location-id"] = credentials.locationId;
      if (credentials?.apiKey) headers["x-crm-api-key"] = credentials.apiKey;

      // Obtener y adjuntar el token de autenticación de Firebase
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } catch (e) {
          console.warn("No se pudo obtener el token de Firebase Auth para las cabeceras:", e);
        }
      }

      const response = await fetch("/api/ghl/contacts", {
        method: "POST",
        headers,
        body: JSON.stringify(contactPayload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar contacto en el servidor CRM.");
      }

      return data.contact;
    } catch (err: any) {
      setError(err.message || "Error al crear contacto en el CRM.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchContacts, createContact };
}
