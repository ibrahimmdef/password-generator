import { useEffect, useRef } from "react";

/**
 * Keyboard shortcuts with Ctrl (Windows/Linux) or Cmd (macOS).
 * map: { f: () => ..., n: () => ... }
 */
export function useShortcuts(map) {
  const latest = useRef(map);
  useEffect(() => {
    latest.current = map;
  });

  useEffect(() => {
    function onKeyDown(e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      const handler = latest.current[e.key.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
