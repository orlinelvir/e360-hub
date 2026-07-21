import { useState, useCallback } from "react";

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
