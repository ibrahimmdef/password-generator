// Small helpers for showing values to people.

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS = [
  ["year", 365 * 24 * 3600e3],
  ["month", 30 * 24 * 3600e3],
  ["week", 7 * 24 * 3600e3],
  ["day", 24 * 3600e3],
  ["hour", 3600e3],
  ["minute", 60e3],
];

/** 1700000000000 -> "3 months ago" */
export function timeAgo(timestamp, now = Date.now()) {
  const diff = timestamp - now;
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

/** "287082" -> "287 082" so the code is easier to read */
export function groupDigits(code) {
  const mid = Math.ceil(code.length / 2);
  return `${code.slice(0, mid)} ${code.slice(mid)}`;
}

export const ISSUE_LABEL = { weak: "Weak", reused: "Reused", old: "Old" };
