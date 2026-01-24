import type { NotifyRequest } from "@/types/github";

/**
 * GitHub Webhook の action に応じて Discord に送信するメッセージコンテンツを生成する
 */
export function buildContent(body: NotifyRequest): string {
  let content: string = `${body.sender.login}\n`;
  switch (body.action) {
    case "opened":
      content += `## Open\n${body.issue?.body || body.pull_request?.body}`;
      break;
    case "created":
      content += `## Message\n${body.comment?.body}`;
      break;
    case "edited":
      content += "コメントが編集されました";
      break;
    case "submitted":
      content += `## Review Comment\n${body.review?.body}`;
      break;
    case "closed":
      content += "## Close\nこのスレッドはクローズされました";
      break;
    default:
      content += "";
  }
  return content;
}

/**
 * Discord スレッド名を生成する
 */
export function buildThreadName(body: NotifyRequest): string {
  return `#${body.issue?.number || body.pull_request?.number} ${body.issue?.title || body.pull_request?.title}(${body.issue?.url || body.pull_request?.url})`;
}
