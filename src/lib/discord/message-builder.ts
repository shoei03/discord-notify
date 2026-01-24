import type { NotifyRequest } from "@/types/github";

/**
 * GitHub Webhook の action に応じて Discord に送信するメッセージコンテンツを生成する
 */
export function buildContent(
  body: NotifyRequest
): string {
  switch (body.action) {
    case "opened":
      return `## Open\n${body.issue?.body || body.pull_request?.body}`;
    case "created":
      return `## Message\n${body.comment?.body}`;
    case "edited":
      return "コメントが編集されました";
    case "submitted":
      return `## Review Comment\n${body.review?.body}`;
    case "closed":
      return "## Close\nこのスレッドはクローズされました";
    default:
      return "";
  }
}

/**
 * Discord スレッド名を生成する
 */
export function buildThreadName(body: NotifyRequest): string {
  return `[${body.issue?.title || body.pull_request?.title}](${body.issue?.url || body.pull_request?.url} "${body.issue?.title || body.pull_request?.title}")`;
}
