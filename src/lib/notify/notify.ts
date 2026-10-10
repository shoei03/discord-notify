import { sendToDiscord } from "@/lib/discord/client";
import {
  buildContent,
  buildThreadKey,
  buildThreadName,
} from "@/lib/discord/message-builder";
import { findThread, saveThread } from "@/lib/supabase/threads";
import type { WebhookEvent } from "@/types/github";

export interface NotifyDeps {
  findThread: typeof findThread;
  saveThread: typeof saveThread;
  sendToDiscord: typeof sendToDiscord;
}

export type NotifyOutcome =
  | { kind: "ignored"; reason: string }
  | { kind: "sent"; threadId: string; threadName: string; created: boolean }
  | { kind: "error"; stage: "lookup" | "discord"; error: string };

const defaultDeps: NotifyDeps = { findThread, saveThread, sendToDiscord };

/**
 * イベントを Discord のスレッドに投稿する。スレッドが無ければ作って DB に記録する
 */
export async function notify(
  event: WebhookEvent,
  deps: NotifyDeps = defaultDeps,
): Promise<NotifyOutcome> {
  const content = buildContent(event);
  if (content === null) {
    return {
      kind: "ignored",
      reason: `Unsupported action: ${event.name}.${event.action}`,
    };
  }

  const threadKey = buildThreadKey(event);
  const threadName = buildThreadName(event);

  // 検索に失敗したまま進むと重複スレッドを作るので、エラーにして GitHub に再送させる
  const existing = await deps.findThread({
    key: threadKey,
    legacyName: threadName,
  });
  if (!existing.ok) {
    return { kind: "error", stage: "lookup", error: existing.error };
  }
  const existingThreadId = existing.value?.thread_id;

  const sent = await deps.sendToDiscord({
    content,
    threadName,
    threadId: existingThreadId,
  });
  if (!sent.ok) {
    return { kind: "error", stage: "discord", error: sent.error };
  }

  if (existingThreadId) {
    return {
      kind: "sent",
      threadId: existingThreadId,
      threadName,
      created: false,
    };
  }

  // Discord には投稿済みなので、保存に失敗してもエラーにしない（再送されるとスレッドが重複する）
  const saved = await deps.saveThread({
    key: threadKey,
    name: threadName,
    threadId: sent.value.threadId,
  });
  if (!saved.ok) {
    console.error("Failed to save thread:", saved.error);
  }
  return {
    kind: "sent",
    threadId: sent.value.threadId,
    threadName,
    created: true,
  };
}
