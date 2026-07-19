"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "film-opportunity-radar-watchlist";
const DEFAULT_ITEMS = ["sequel-anxiety", "practical-effects-renaissance"];

function readItems() {
  if (typeof window === "undefined") return DEFAULT_ITEMS;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_ITEMS;
  try {
    return JSON.parse(stored) as string[];
  } catch {
    return DEFAULT_ITEMS;
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);

  useEffect(() => {
    setItems(readItems());
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readItems();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setItems(next);
    queueMicrotask(() => window.dispatchEvent(new Event("film-watchlist-change")));
  }, []);

  useEffect(() => {
    const sync = () => setItems(readItems());
    window.addEventListener("film-watchlist-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("film-watchlist-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { items, isSaved: (id: string) => items.includes(id), toggle };
}
