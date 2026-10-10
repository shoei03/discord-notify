import { describe, expect, test } from "bun:test";
import { loadEnv } from "./env";

const valid = {
  DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/123/abc-DEF_9",
  GITHUB_WEBHOOK_SECRET: "secret",
  SUPABASE_URL: "https://xxx.supabase.co",
  SUPABASE_SECRET_KEY: "key",
};

describe("loadEnv", () => {
  test("すべて揃っていれば読み込める", () => {
    expect(loadEnv(valid).discordWebhookUrl).toBe(valid.DISCORD_WEBHOOK_URL);
  });

  test("欠けている変数名をエラーに含める", () => {
    expect(() => loadEnv({ ...valid, SUPABASE_URL: undefined })).toThrow(
      "SUPABASE_URL is not set",
    );
  });

  test.each([
    "https://evil.example.com/api/webhooks/123/abc",
    "http://discord.com/api/webhooks/123/abc",
    "https://discord.com.evil.example/api/webhooks/123/abc",
    "https://discord.com/api/webhooks/123/abc?x=https://evil.example",
  ])("Discord 以外の URL を拒否する: %s", (url) => {
    expect(() => loadEnv({ ...valid, DISCORD_WEBHOOK_URL: url })).toThrow(
      "not a Discord webhook URL",
    );
  });
});
