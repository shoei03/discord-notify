const DISCORD_FORUM_CHANNEL_ID = process.env.DISCORD_FORUM_CHANNEL_ID;

interface DiscordEmbed {
  title: string;
  description: string;
  author: {
    name: string;
    icon_url: string;
  };
  timestamp: string;
}

interface DiscordPayload {
  content?: string;
  sender?: Sender;
  thread_name?: string;
  embeds?: DiscordEmbed[];
}

type Sender = { login: string; avatar_url: string } | undefined;

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
  sender: Sender,
  threadName: string,
  threadId?: string,
): DiscordPayload {
    const embeds: DiscordEmbed[] = [
        {
            title: threadName,
            description: content,
            author: {
                name: sender?.login || "Unknown",
                icon_url: sender?.avatar_url || "",
            },
            timestamp: new Date().toISOString(),
        }
    ]
  return threadId ? { content } : { thread_name: threadName, embeds: embeds };
}

/**
 * Discord API にメッセージを送信する
 */
export async function sendToDiscord(
  content: string,
  sender: Sender,
  threadName: string,
  threadId?: string,
): Promise<Response> {
  const url = buildDiscordUrl(threadId);
  const payload = buildPayload(content, sender, threadName, threadId);

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
