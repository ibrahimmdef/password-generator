import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);
const CLEAR_CLIPBOARD_AFTER = 30_000;

/**
 * Shows short messages at the bottom ("Password copied") and offers copy(),
 * which also empties the clipboard again after 30 seconds.
 */
export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const hideTimer = useRef();
  const clearTimer = useRef();

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      clearTimeout(clearTimer.current);
    },
    [],
  );

  const show = useCallback((text) => {
    clearTimeout(hideTimer.current);
    setMessage(text);
    hideTimer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  const copy = useCallback(
    async (text, what) => {
      try {
        await navigator.clipboard.writeText(text);
        show(`${what} copied. Clears in 30 seconds.`);
        clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(
          () => navigator.clipboard.writeText("").catch(() => {}),
          CLEAR_CLIPBOARD_AFTER,
        );
      } catch {
        show(`Couldn't copy the ${what.toLowerCase()}. Select it and copy it manually.`);
      }
    },
    [show],
  );

  return (
    <ToastContext.Provider value={{ show, copy }}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center">
        {message && (
          <div className="animate-toast-in rounded-full bg-primary px-3.5 py-2 font-medium text-on-primary shadow-[0_6px_20px_rgb(0_0_0/0.18)] motion-reduce:animate-none">
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() must be used inside <ToastProvider>.");
  return ctx;
}
