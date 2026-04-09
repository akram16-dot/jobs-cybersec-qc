"use client";

import { useCallback, useEffect, useState } from "react";

const CLIENT_ID_KEY = "jcsq_client_id";

function getOrCreateClientId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id =
      (crypto as unknown as { randomUUID?: () => string }).randomUUID?.() ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function useFavorites() {
  const [clientId, setClientId] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = getOrCreateClientId();
    setClientId(id);
    if (!id) return;
    fetch(`/api/favorites?client_id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<string>(
          ((data?.jobs as { id: string }[]) || []).map((j) => j.id)
        );
        setFavoriteIds(ids);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = useCallback(
    async (jobId: string) => {
      if (!clientId) return;
      const isFav = favoriteIds.has(jobId);
      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
      try {
        await fetch("/api/favorites", {
          method: isFav ? "DELETE" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ client_id: clientId, job_id: jobId }),
        });
      } catch {
        // Rollback en cas d'erreur
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
      }
    },
    [clientId, favoriteIds]
  );

  return { clientId, favoriteIds, toggle, loaded };
}
