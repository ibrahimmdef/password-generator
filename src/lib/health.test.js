import { describe, expect, it } from "vitest";
import { analyzeHealth } from "./health";
import { blankDraft, createLogin } from "./vault";

const NOW = Date.UTC(2026, 10, 24);
const DAY = 86_400_000;

function login(title, password, changedDaysAgo = 0) {
  const l = createLogin({ ...blankDraft(), title, password }, NOW);
  return { ...l, passwordChangedAt: NOW - changedDaysAgo * DAY };
}

describe("analyzeHealth", () => {
  it("flags short, simple passwords as weak", () => {
    const weak = login("a", "summer24");
    const strong = login("b", "x7#Kq9!vLm2@Pz4$");
    const r = analyzeHealth([weak, strong], NOW);
    expect(r.issues.get(weak.id)).toEqual(["weak"]);
    expect(r.issues.has(strong.id)).toBe(false);
  });

  it("finds reused passwords and who shares them", () => {
    const a = login("GitHub", "x7#Kq9!vLm2@Pz4$");
    const b = login("Gmail", "x7#Kq9!vLm2@Pz4$");
    const r = analyzeHealth([a, b], NOW);
    expect(r.issues.get(a.id)).toEqual(["reused"]);
    expect(r.sharedWith.get(a.id).map((l) => l.title)).toEqual(["Gmail"]);
    expect(r.counts.reused).toBe(2);
  });

  it("flags passwords unchanged for over a year", () => {
    const old = login("Bank", "x7#Kq9!vLm2@Pz4$", 400);
    expect(analyzeHealth([old], NOW).issues.get(old.id)).toEqual(["old"]);
  });

  it("ignores logins without a password", () => {
    expect(analyzeHealth([login("empty", "")], NOW).issues.size).toBe(0);
  });
});
