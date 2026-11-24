import { describe, expect, it } from "vitest";
import { createVault, seal, unlockVault, WrongPasswordError } from "./crypto";

// Few iterations keep the tests fast; the app itself uses 600,000.
const FAST = 1_000;

describe("vault encryption", () => {
  it("round-trips data with the right password", async () => {
    const { file } = await createVault("correct horse", { secret: "hi" }, FAST);
    const { data } = await unlockVault("correct horse", file);
    expect(data.secret).toBe("hi");
  });

  it("never stores the data or password in plain text", async () => {
    const { file } = await createVault("correct horse", { secret: "plain-value" }, FAST);
    const raw = JSON.stringify(file);
    expect(raw).not.toContain("plain-value");
    expect(raw).not.toContain("correct horse");
  });

  it("rejects a wrong password", async () => {
    const { file } = await createVault("correct horse", { a: 1 }, FAST);
    await expect(unlockVault("wrong", file)).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("rejects a tampered file", async () => {
    const { file } = await createVault("pw", { a: 1 }, FAST);
    const bytes = atob(file.data);
    const flipped = String.fromCharCode(bytes.charCodeAt(0) ^ 1) + bytes.slice(1);
    await expect(unlockVault("pw", { ...file, data: btoa(flipped) })).rejects.toBeInstanceOf(
      WrongPasswordError,
    );
  });

  it("uses a fresh IV on every save", async () => {
    const { key } = await createVault("pw", {}, FAST);
    const a = await seal(key, { x: 1 });
    const b = await seal(key, { x: 1 });
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
  });
});
