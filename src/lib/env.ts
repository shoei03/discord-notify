import "server-only";

export interface Env {
  discordWebhookUrl: string;
  githubWebhookSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

// Webhook URL 自体がトークンなので、別ホストに本文を送らないよう Discord 以外は拒否する
const DISCORD_WEBHOOK_URL_PATTERN =
  /^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;

let cached: Env | undefined;

/**
 * 環境変数を検証して返す。build 時に落ちないよう、初回呼び出し時に検証する
 */
export function getEnv(): Env {
  cached ??= loadEnv(process.env);
  return cached;
}

export function loadEnv(source: Record<string, string | undefined>): Env {
  const discordWebhookUrl = required(source, "DISCORD_WEBHOOK_URL");
  if (!DISCORD_WEBHOOK_URL_PATTERN.test(discordWebhookUrl)) {
    throw new Error("DISCORD_WEBHOOK_URL is not a Discord webhook URL");
  }
  return {
    discordWebhookUrl,
    githubWebhookSecret: required(source, "GITHUB_WEBHOOK_SECRET"),
    supabaseUrl: required(source, "SUPABASE_URL"),
    supabaseServiceRoleKey: required(source, "SUPABASE_SERVICE_ROLE_KEY"),
  };
}

function required(
  source: Record<string, string | undefined>,
  name: string,
): string {
  const value = source[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}
