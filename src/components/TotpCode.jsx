import { useEffect, useState } from "react";
import { parseTotp, secondsRemaining, totp } from "../lib/totp";
import { groupDigits } from "../lib/format";
import { useNow } from "../hooks/useNow";
import { Muted } from "./ui";

const R = 7;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** The live 2FA code with a countdown ring. Re-renders every second. */
export function TotpCode({ secret, onCode }) {
  const config = parseTotp(secret);
  const now = useNow(1000);
  const [code, setCode] = useState("");

  // The code only changes once per period, so we recalculate when the
  // period number ("step") changes, not every second.
  const period = config?.period ?? 30;
  const step = Math.floor(now / 1000 / period);
  const valid = config !== null;

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    totp(parseTotp(secret), step * period * 1000).then((c) => {
      if (!cancelled) setCode(c);
    });
    // If the step changes before totp() finishes, ignore the old result
    return () => {
      cancelled = true;
    };
  }, [secret, step, period, valid]);

  // Tell the parent the current code, so its Copy button can use it
  useEffect(() => {
    onCode?.(code);
  }, [code, onCode]);

  if (!valid) return <Muted>This setup key isn't valid.</Muted>;

  const left = secondsRemaining(period, now);

  return (
    <span className="flex items-center gap-2.5">
      <span
        className="font-mono text-xl font-semibold tracking-[0.06em] tabular-nums"
        aria-label={code ? `Code ${code.split("").join(" ")}` : "Loading code"}
      >
        {code ? groupDigits(code) : "··· ···"}
      </span>
      <svg className="size-[18px] -rotate-90" viewBox="0 0 18 18" role="img" aria-label={`${left} seconds left`}>
        <circle className="stroke-line" cx="9" cy="9" r={R} fill="none" strokeWidth="2.5" />
        <circle
          className="stroke-ink-2 transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
          cx="9"
          cy="9"
          r={R}
          fill="none"
          strokeWidth="2.5"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - left / period)}
        />
      </svg>
    </span>
  );
}
