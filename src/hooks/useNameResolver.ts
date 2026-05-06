import { useCallback, useRef, useState } from "react";
import { resolveNames } from "@/lib/esi";

/**
 * Maintains a cache of ESI ID → name mappings.
 * Call resolve(ids) whenever you have new IDs; it only fetches unknown ones.
 */
export function useNameResolver() {
  const cache = useRef<Map<number, string>>(new Map());
  const [, setTick] = useState(0);
  const pending = useRef<Set<number>>(new Set());

  const resolve = useCallback(async (ids: number[]) => {
    const unknown = ids.filter(
      (id) => id && !cache.current.has(id) && !pending.current.has(id),
    );
    if (unknown.length === 0) return;

    for (const id of unknown) pending.current.add(id);

    try {
      const names = await resolveNames(unknown);
      for (const n of names) {
        cache.current.set(n.id, n.name);
      }
      setTick((t) => t + 1); // trigger re-render
    } catch {
      // Silently fail — names will just show as IDs
    } finally {
      for (const id of unknown) pending.current.delete(id);
    }
  }, []);

  const getName = useCallback(
    (id: number, fallback?: string) => cache.current.get(id) ?? fallback ?? `#${id}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { resolve, getName };
}
