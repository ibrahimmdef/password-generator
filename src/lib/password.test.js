import { describe, expect, it } from "vitest";
import {
  AMBIGUOUS,
  CHARSETS,
  entropyBits,
  estimateEntropy,
  generatePassword,
  randomInt,
  strengthOf,
} from "./password";

const base = {
  length: 16,
  upper: true,
  lower: true,
  digit: true,
  symbol: true,
  excludeAmbiguous: false,
};

describe("generatePassword", () => {
  it("returns the requested length", () => {
    for (const length of [4, 12, 32, 64]) {
      expect(generatePassword({ ...base, length })).toHaveLength(length);
    }
  });

  it("returns null when every group is off", () => {
    expect(
      generatePassword({ ...base, upper: false, lower: false, digit: false, symbol: false }),
    ).toBeNull();
  });

  it("includes at least one character from every group that is on", () => {
    for (let i = 0; i < 500; i++) {
      const pw = [...generatePassword({ ...base, length: 4 })];
      expect(pw.some((c) => CHARSETS.upper.includes(c))).toBe(true);
      expect(pw.some((c) => CHARSETS.lower.includes(c))).toBe(true);
      expect(pw.some((c) => CHARSETS.digit.includes(c))).toBe(true);
      expect(pw.some((c) => CHARSETS.symbol.includes(c))).toBe(true);
    }
  });

  it("only uses groups that are on", () => {
    const pw = generatePassword({ ...base, upper: false, symbol: false, length: 64 });
    expect(pw).toMatch(/^[a-z0-9]+$/);
  });

  it("leaves out look-alike characters when asked", () => {
    for (let i = 0; i < 200; i++) {
      const pw = generatePassword({ ...base, length: 64, excludeAmbiguous: true });
      for (const ch of AMBIGUOUS) expect(pw).not.toContain(ch);
    }
  });
});

describe("randomInt", () => {
  it("stays in range and covers every value", () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) {
      const n = randomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
      seen.add(n);
    }
    expect(seen.size).toBe(7);
  });

  it("rejects invalid bounds", () => {
    expect(() => randomInt(0)).toThrow(RangeError);
    expect(() => randomInt(1.5)).toThrow(RangeError);
  });
});

describe("entropy and strength", () => {
  it("computes bits from pool size and length", () => {
    const opts = { ...base, upper: false, digit: false, symbol: false, length: 10 };
    expect(entropyBits(opts)).toBeCloseTo(10 * Math.log2(26));
  });

  it("estimates entropy of an existing password", () => {
    expect(estimateEntropy("")).toBe(0);
    expect(estimateEntropy("abcd")).toBeCloseTo(4 * Math.log2(26));
    expect(estimateEntropy("aB3!")).toBeCloseTo(4 * Math.log2(95));
  });

  it("maps bits to a strength level", () => {
    expect(strengthOf(30)).toBe("weak");
    expect(strengthOf(50)).toBe("fair");
    expect(strengthOf(80)).toBe("strong");
    expect(strengthOf(120)).toBe("excellent");
  });
});
