import { describe, expect, it } from "vitest";
import { countFor, filterLogins } from "./filter";
import { analyzeHealth } from "./health";
import { blankDraft, createLogin } from "./vault";

const make = (fields) => createLogin({ ...blankDraft(), ...fields });

const logins = [
  make({ title: "netflix", username: "me@mail.com", password: "abc", category: "Personal" }),
  make({ title: "GitHub", username: "ibrahim", password: "x7#Kq9!vLm2@Pz4$", favorite: true, totp: "JBSWY3DP" }),
  make({ title: "Bank", username: "1234", password: "abc", category: "Finance", url: "mybank.com" }),
];
const health = analyzeHealth(logins);

describe("filterLogins", () => {
  it("sorts by title, ignoring case", () => {
    expect(filterLogins(logins, { filter: { kind: "all" } }).map((l) => l.title)).toEqual([
      "Bank",
      "GitHub",
      "netflix",
    ]);
  });

  it("filters by favorites, 2FA and category", () => {
    expect(filterLogins(logins, { filter: { kind: "favorites" } }).map((l) => l.title)).toEqual(["GitHub"]);
    expect(filterLogins(logins, { filter: { kind: "totp" } }).map((l) => l.title)).toEqual(["GitHub"]);
    expect(
      filterLogins(logins, { filter: { kind: "category", name: "Finance" } }).map((l) => l.title),
    ).toEqual(["Bank"]);
  });

  it("searches title, username and website", () => {
    expect(filterLogins(logins, { filter: { kind: "all" }, query: "IBRA" }).map((l) => l.title)).toEqual(["GitHub"]);
    expect(filterLogins(logins, { filter: { kind: "all" }, query: "mybank" }).map((l) => l.title)).toEqual(["Bank"]);
  });

  it("shows only logins with issues in health, optionally one kind", () => {
    const all = filterLogins(logins, { filter: { kind: "health" }, health });
    expect(all.map((l) => l.title)).toEqual(["Bank", "netflix"]);
    const reused = filterLogins(logins, { filter: { kind: "health" }, health, issue: "reused" });
    expect(reused).toHaveLength(2);
  });

  it("counts sidebar items", () => {
    expect(countFor(logins, { kind: "all" }, health)).toBe(3);
    expect(countFor(logins, { kind: "health" }, health)).toBe(2);
  });
});
