import { estimateEntropy } from "./password";

// Issue names: "weak" | "reused" | "old"

export const WEAK_BELOW_BITS = 60;
export const OLD_AFTER_DAYS = 365;
const DAY = 24 * 60 * 60 * 1000;

/**
 * Checks every login and returns:
 * - issues:     Map of login id -> ["weak", "reused", ...]  (healthy logins are left out)
 * - sharedWith: Map of login id -> other logins with the same password
 * - counts:     { weak, reused, old }
 */
export function analyzeHealth(logins, now = Date.now()) {
  // Group logins by password to find reuse
  const byPassword = new Map();
  for (const l of logins) {
    if (!l.password) continue;
    const group = byPassword.get(l.password) ?? [];
    group.push(l);
    byPassword.set(l.password, group);
  }

  const issues = new Map();
  const sharedWith = new Map();
  const counts = { weak: 0, reused: 0, old: 0 };

  for (const l of logins) {
    if (!l.password) continue;
    const found = [];

    if (estimateEntropy(l.password) < WEAK_BELOW_BITS) found.push("weak");

    const group = byPassword.get(l.password);
    if (group.length > 1) {
      found.push("reused");
      sharedWith.set(l.id, group.filter((o) => o.id !== l.id));
    }

    if (now - l.passwordChangedAt > OLD_AFTER_DAYS * DAY) found.push("old");

    if (found.length) {
      issues.set(l.id, found);
      for (const i of found) counts[i]++;
    }
  }

  return { issues, sharedWith, counts };
}
