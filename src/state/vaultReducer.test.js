import { describe, expect, it } from "vitest";
import { initialState, vaultReducer } from "./vaultReducer";
import { blankDraft, createLogin, emptyVault } from "../lib/vault";

const unlocked = { status: "unlocked", key: "KEY", vault: emptyVault() };
const github = createLogin({ ...blankDraft(), title: "GitHub", password: "old" }, 1000);

function withGithub() {
  return vaultReducer(unlocked, { type: "login/added", login: github });
}

describe("vaultReducer", () => {
  it("goes to setup or locked after checking storage", () => {
    expect(vaultReducer(initialState, { type: "storage/checked", hasVault: false }).status).toBe("setup");
    expect(vaultReducer(initialState, { type: "storage/checked", hasVault: true }).status).toBe("locked");
  });

  it("reports a vault that can't be read instead of offering setup", () => {
    const next = vaultReducer(initialState, { type: "storage/failed", message: "damaged" });
    expect(next.status).toBe("error");
    expect(next.error).toBe("damaged");
  });

  it("forgets the key and data when locked", () => {
    expect(vaultReducer(unlocked, { type: "vault/locked" })).toEqual({
      status: "locked",
      key: null,
      vault: null,
      error: null,
    });
  });

  it("adds a login without changing the old state", () => {
    const next = withGithub();
    expect(next.vault.logins).toHaveLength(1);
    expect(unlocked.vault.logins).toHaveLength(0); // the old state is untouched
  });

  it("updates a login and records when the password changed", () => {
    const next = vaultReducer(withGithub(), {
      type: "login/updated",
      id: github.id,
      draft: { ...blankDraft(), title: "GitHub", password: "new" },
      now: 5000,
    });
    expect(next.vault.logins[0].password).toBe("new");
    expect(next.vault.logins[0].passwordChangedAt).toBe(5000);
  });

  it("imports several logins at once", () => {
    const next = vaultReducer(unlocked, { type: "logins/imported", logins: [github, { ...github, id: "2" }] });
    expect(next.vault.logins).toHaveLength(2);
  });

  it("removes a login and toggles favorites", () => {
    const fav = vaultReducer(withGithub(), { type: "login/favoriteToggled", id: github.id });
    expect(fav.vault.logins[0].favorite).toBe(true);
    const removed = vaultReducer(fav, { type: "login/removed", id: github.id });
    expect(removed.vault.logins).toHaveLength(0);
  });

  it("adds a category only once and ignores blank names", () => {
    const once = vaultReducer(unlocked, { type: "category/added", name: " Games " });
    expect(once.vault.categories).toContain("Games");
    expect(vaultReducer(once, { type: "category/added", name: "Games" })).toBe(once);
    expect(vaultReducer(once, { type: "category/added", name: "  " })).toBe(once);
  });

  it("ignores data changes while locked", () => {
    const locked = { status: "locked", key: null, vault: null };
    expect(vaultReducer(locked, { type: "login/removed", id: "x" })).toBe(locked);
  });

  it("throws on an unknown action, so typos are caught early", () => {
    expect(() => vaultReducer(unlocked, { type: "login/addd" })).toThrow("Unknown action");
  });
});
