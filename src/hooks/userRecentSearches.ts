/**
 * useRecentSearches.ts
 * ─────────────────────────────────────────────────────────
 * Persists up to MAX_ITEMS recent location searches in AsyncStorage.
 * Survives app close. Users can clear the list.
 *
 * Usage:
 *   const { recents, addRecent, clearRecents } = useRecentSearches();
 *
 * Install:
 *   npx expo install @react-native-async-storage/async-storage
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@voltgo_recent_searches";
const MAX_ITEMS = 8;

export interface RecentSearch {
  id: string;
  name: string;
  address: string;
  coords?: { latitude: number; longitude: number };
  timestamp: number;
}

interface Result {
  recents: RecentSearch[];
  addRecent: (item: Omit<RecentSearch, "id" | "timestamp">) => Promise<void>;
  clearRecents: () => Promise<void>;
}

export function useRecentSearches(): Result {
  const [recents, setRecents] = useState<RecentSearch[]>([]);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecents(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (items: RecentSearch[]) => {
    setRecents(items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addRecent = useCallback(
    async (item: Omit<RecentSearch, "id" | "timestamp">) => {
      setRecents((prev) => {
        // Deduplicate by name
        const filtered = prev.filter(
          (r) => r.name.toLowerCase() !== item.name.toLowerCase()
        );
        const next: RecentSearch[] = [
          {
            ...item,
            id: `${Date.now()}`,
            timestamp: Date.now(),
          },
          ...filtered,
        ].slice(0, MAX_ITEMS);

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const clearRecents = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return { recents, addRecent, clearRecents };
}



