import "server-only";
import { getEnv } from "@/lib/env";
import { err, ok, type Result } from "@/lib/result";
import type { DiscordMessage, DiscordPayload } from "@/types/discord";

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Discord フォーラムに投稿する。threadId が無ければ threadName で新しいスレッドを作る
 */
export async function sendToDiscord({
  content,
  threadName,
  threadId,
}: {
  content: string;
  threadName: string;
  threadId?: string;
}): Promise<Result<{ threadId: string }>> {
  const url = new URL(getEnv().discordWebhookUrl);
  url.searchParams.set("wait", "true");
  if (threadId) {
    url.searchParams.set("thread_id", threadId);
  }

  // Issue 本文などに含まれる @everyone / @here / メンションで通知を飛ばさない
  const payload: DiscordPayload = threadId
    ? { content, allowed_mentions: { parse: [] } }
    : { thread_name: threadName, content, allowed_mentions: { parse: [] } };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // 例外のメッセージには Webhook URL（トークンを含む）が入ることがあるので、種類だけ残す
    const name = error instanceof Error ? error.name : "UnknownError";
    return err(`Discord request failed: ${name}`);
  }

  if (!response.ok) {
    const body = await response.text();
    return err(`Discord API error ${response.status}: ${body}`);
  }
  const message: DiscordMessage = await response.json();
  return ok({ threadId: message.channel_id });
}
