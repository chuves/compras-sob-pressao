import { useEffect, useState } from "react";

function readValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Like useState, but persisted to localStorage under `key` and kept in sync
 * with changes made in OTHER tabs via the native "storage" event.
 *
 * Persistence happens in a useEffect keyed on the resolved value, never
 * inside the state updater itself — React (Strict Mode) intentionally
 * invokes updater functions twice in development to catch impure reducers,
 * which would double-write/double-append here if the write were done there.
 */
export function useLocalStorageState<T>(
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readValue(key, fallback));

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(readValue(key, fallback));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable (private mode, quota) — state still works in-memory.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue];
}
