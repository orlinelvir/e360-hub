import { useState, useCallback } from "react";

export function useGHLContacts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/ghl/contacts", window.location.origin);
      if (query) url.searchParams.append("query", query);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al consultar contactos de GHL.");
      }

      return data.contacts || [];
    } catch (err: any) {
      setError(err.message || "Error de conexión con GHL API.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createContact = useCallback(async (contactPayload: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ghl/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactPayload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar contacto en GHL.");
      }

      return data.contact;
    } catch (err: any) {
      setError(err.message || "Error al crear contacto.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchContacts, createContact };
}
