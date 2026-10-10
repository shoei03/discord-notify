import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { verifySignature } from "./verify-signature";

const secret = "secret";
const body = '{"action":"opened"}';
const sign = (text: string, key = secret) =>
  `sha256=${createHmac("sha256", key).update(text).digest("hex")}`;

describe("verifySignature", () => {
  test("正しい署名を受け付ける", () => {
    expect(verifySignature(body, sign(body), secret)).toBe(true);
  });

  test("別の secret の署名を拒否する", () => {
    expect(verifySignature(body, sign(body, "other"), secret)).toBe(false);
  });

  test("改ざんされた本文を拒否する", () => {
    expect(verifySignature(`${body} `, sign(body), secret)).toBe(false);
  });

  test("署名ヘッダーが無ければ拒否する", () => {
    expect(verifySignature(body, null, secret)).toBe(false);
  });

  test("長さの違う署名でも例外を出さずに拒否する", () => {
    expect(verifySignature(body, "sha256=abc", secret)).toBe(false);
  });
});
