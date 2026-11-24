import { describe, expect, it } from "vitest";
import { base32Decode, parseTotp, secondsRemaining, totp } from "./totp";

// RFC 6238 test secret: the ASCII text "12345678901234567890"
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp", () => {
  it("matches the RFC 6238 test vectors (SHA-1, 8 digits)", async () => {
    const cfg = { secret: RFC_SECRET, digits: 8, period: 30 };
    expect(await totp(cfg, 59_000)).toBe("94287082");
    expect(await totp(cfg, 1111111109_000)).toBe("07081804");
    expect(await totp(cfg, 1234567890_000)).toBe("89005924");
    expect(await totp(cfg, 20000000000_000)).toBe("65353130");
  });

  it("produces 6-digit codes by default", async () => {
    expect(await totp(parseTotp(RFC_SECRET), 59_000)).toBe("287082");
  });

  it("decodes base32 with spaces and lowercase", () => {
    expect(new TextDecoder().decode(base32Decode("gezd gnbv"))).toBe("12345");
  });

  it("parses otpauth links", () => {
    const cfg = parseTotp(
      "otpauth://totp/GitHub:me?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&digits=6&period=30",
    );
    expect(cfg).toEqual({ secret: "JBSWY3DPEHPK3PXP", digits: 6, period: 30 });
  });

  it("rejects invalid input", () => {
    expect(parseTotp("")).toBeNull();
    expect(parseTotp("not a key!")).toBeNull();
    expect(parseTotp("otpauth://hotp/x?secret=JBSWY3DP")).toBeNull();
  });

  it("counts down within the period", () => {
    expect(secondsRemaining(30, 0)).toBe(30);
    expect(secondsRemaining(30, 29_000)).toBe(1);
  });
});
