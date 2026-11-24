import { useEffect, useRef } from "react";

const EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "touchstart"];

/** Calls `onIdle` after `ms` without any mouse or keyboard activity. */
export function useIdle(onIdle, ms) {
  // Keep the latest callback in a ref, so changing it doesn't restart the timer
  const callback = useRef(onIdle);
  useEffect(() => {
    callback.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    let timer = setTimeout(() => callback.current(), ms);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => callback.current(), ms);
    };
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [ms]);
}
