const DISCORD_FORUM_CHANNEL_ID = process.env.DISCORD_FORUM_CHANNEL_ID;

interface DiscordPayload {
  content: string;
  thread_name?: string;
}

/**
 * Discord API の URL を構築する
 */
function buildDiscordUrl(threadId?: string): string {
  const baseUrl = `${DISCORD_FORUM_CHANNEL_ID}?wait=true`;
  return threadId ? `${baseUrl}&thread_id=${threadId}` : baseUrl;
}

/**
 * Discord API に送信するペイロードを構築する
 */
function buildPayload(
  content: string,
  threadName: string,
  threadId?: string,
): DiscordPayload {
  return threadId ? { content } : { thread_name: threadName, content };
}

/**
 * Discord API にメッセージを送信する
 */
export async function sendToDiscord(
  content: string,
  threadName: string,
  threadId?: string,
): Promise<Response> {
  const url = buildDiscordUrl(threadId);
  const payload = buildPayload(content, threadName, threadId);

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
