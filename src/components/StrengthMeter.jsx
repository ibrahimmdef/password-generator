import { estimateEntropy, strengthOf } from "../lib/password";

const LEVELS = ["weak", "fair", "strong", "excellent"];
const LABEL = { weak: "Weak", fair: "Fair", strong: "Strong", excellent: "Excellent" };

/** Four bars plus a text label; the label carries the meaning, not the color. */
export function StrengthMeter({ password }) {
  if (!password) return null;
  const bits = estimateEntropy(password);
  const level = strengthOf(bits);
  const index = LEVELS.indexOf(level);
  const on = level === "weak" ? "bg-signal" : "bg-ink-2";

  return (
    <div className="flex items-center gap-2.5">
      <div className="grid grid-cols-[repeat(4,22px)] gap-[3px]" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <span key={l} className={`h-1 rounded-sm ${i <= index ? on : "bg-line"}`} />
        ))}
      </div>
      <span className="text-ink-2">
        {LABEL[level]}, {Math.round(bits)} bits
      </span>
    </div>
  );
}
