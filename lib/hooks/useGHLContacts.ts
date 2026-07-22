import { useState, useCallback } from "react";
import { auth } from "@/lib/firebase";

export interface CRMCredentials {
  locationId?: string;
  apiKey?: string;
}

/**
 * Función auxiliar para realizar peticiones HTTP con reintentos automáticos
 * ante errores de red temporales o fallos 5xx del servidor.
 * No reintenta en errores 4xx (ej: 400, 401, 403) porque son problemas de configuración del cliente.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  delayMs = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Si es un error de servidor (500 en adelante) y aún nos quedan reintentos, esperamos y reintentamos
    if (!response.ok && response.status >= 500 && retries > 0) {
      console.warn(`CRM API falló con código ${response.status}. Reintentando en ${delayMs}ms... (Intentos restantes: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 1.5);
    }
    
    return response;
  } catch (error) {
    // Si la conexión falló completamente (error de red física) y hay intentos, reintentar
    if (retries > 0) {
      console.warn(`Error de red física al conectar con el CRM. Reintentando en ${delayMs}ms... (Intentos restantes: ${retries})`, error);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 1.5);
    }
    throw error;
  }
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
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } catch (e) {
          console.warn("No se pudo obtener el token de Firebase Auth para las cabeceras:", e);
        }
      }

      const response = await fetchWithRetry(url.toString(), { headers });
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

      const response = await fetchWithRetry("/api/ghl/contacts", {
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
