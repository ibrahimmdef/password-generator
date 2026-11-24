// Password generation and strength helpers. No React in here: just functions.

export const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digit: "0123456789",
  symbol: "!@#$%^&*()-_=+[]{};:,.<>?/|~",
};

// Characters that are easy to confuse with each other
export const AMBIGUOUS = "Il1|O0o";

export const MIN_LENGTH = 4;
export const MAX_LENGTH = 64;

const CLASSES = ["upper", "lower", "digit", "symbol"];

/**
 * A random whole number from 0 up to (but not including) max.
 * Uses crypto.getRandomValues, which is safe for passwords (Math.random is not).
 * Numbers above `limit` are thrown away so every result is equally likely.
 */
export function randomInt(max) {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) {
    throw new RangeError(`max must be an integer in 1..2^32, got ${max}`);
  }
  const limit = 2 ** 32 - (2 ** 32 % max);
  const buf = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

function pick(chars) {
  return chars[randomInt(chars.length)];
}

// Fisher–Yates shuffle: mixes the array in place
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * The character groups turned on in `options`.
 * options looks like: { length, upper, lower, digit, symbol, excludeAmbiguous }
 */
export function activePools(options) {
  return CLASSES.filter((c) => options[c]).map((c) =>
    options.excludeAmbiguous
      ? [...CHARSETS[c]].filter((ch) => !AMBIGUOUS.includes(ch)).join("")
      : CHARSETS[c],
  );
}

/**
 * Makes a password with at least one character from every group that is on.
 * Returns null when every group is off.
 */
export function generatePassword(options) {
  const pools = activePools(options);
  if (pools.length === 0) return null;

  const length = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(options.length)));
  const all = pools.join("");

  const chars = pools.map(pick); // one from each group first
  while (chars.length < length) chars.push(pick(all));

  return shuffle(chars).join("");
}

/** Bits of entropy for a password generated with these options. */
export function entropyBits(options) {
  const poolSize = activePools(options).join("").length;
  if (poolSize === 0) return 0;
  return options.length * Math.log2(poolSize);
}

/**
 * Rough entropy estimate for a password someone already has, based on which
 * kinds of characters it uses. It can't spot dictionary words, so it's generous.
 */
export function estimateEntropy(password) {
  if (!password) return 0;
  let pool = 0;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;
  return password.length * Math.log2(pool);
}

/** "weak" | "fair" | "strong" | "excellent" */
export function strengthOf(bits) {
  if (bits < 45) return "weak";
  if (bits < 65) return "fair";
  if (bits < 100) return "strong";
  return "excellent";
}
