import { describe, expect, it } from "vitest";
import { allServices, SERVICE_CATEGORIES, searchServices } from "./services";
import { DEFAULT_CATEGORIES } from "./vault";

describe("services", () => {
  it("has unique names and known categories", () => {
    const names = allServices().map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    for (const s of allServices()) expect(SERVICE_CATEGORIES).toContain(s.category);
  });

  it("only uses categories a new vault already has", () => {
    for (const c of SERVICE_CATEGORIES) expect(DEFAULT_CATEGORIES).toContain(c);
  });

  it("groups everything by category when the search is empty", () => {
    const groups = searchServices("");
    expect(groups.map((g) => g.category)).toEqual(SERVICE_CATEGORIES);
    expect(groups.flatMap((g) => g.services)).toHaveLength(allServices().length);
  });

  it("searches names, websites and extra words, ignoring case", () => {
    expect(searchServices("TWITTER")[0].services.map((s) => s.name)).toEqual(["X (Twitter)"]);
    expect(searchServices("claude.ai")[0].services.map((s) => s.name)).toEqual(["Claude"]);
    expect(searchServices("zzz")).toEqual([]);
  });
});
