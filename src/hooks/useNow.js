import { useEffect, useState } from "react";

/** The current time, updated every `intervalMs`. Used for the 2FA countdown. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id); // stop the timer when the component goes away
  }, [intervalMs]);

  return now;
}
