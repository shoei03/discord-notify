import type { NotifyRequest } from "@/types/github";

// Discord のメッセージ本文の上限
const MAX_CONTENT_LENGTH = 2000;
const EMPTY_BODY = "(本文なし)";

/**
 * GitHub Webhook の action に応じて Discord に送信するメッセージコンテンツを生成する
 */
export function buildContent(body: NotifyRequest): string | null {
  let content: string = `${body.sender.login}\n`;
  switch (body.action) {
    case "opened":
      content += `## Open\n${body.issue?.body || body.pull_request?.body || EMPTY_BODY}`;
      break;
    case "created":
      content += `## Message\n${body.comment?.body || EMPTY_BODY}`;
      break;
    case "submitted":
      content += `## Review Comment\n${body.review?.body || EMPTY_BODY}`;
      break;
    case "closed":
      content += "## Close\nこのスレッドはクローズされました";
      break;
    default:
      return null;
  }
  return truncate(content, MAX_CONTENT_LENGTH);
}

/**
 * Discord スレッド名を生成する
 * Discord の制限により、スレッド名は100文字以内に制限される
 */
export function buildThreadName(body: NotifyRequest): string {
  const threadName = `#${body.issue?.number || body.pull_request?.number} ${body.issue?.title || body.pull_request?.title}`;
  return threadName.slice(0, 100);
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
