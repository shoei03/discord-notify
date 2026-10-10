import type { WebhookEvent } from "@/types/github";

// Discord のメッセージ本文とスレッド名の上限
const MAX_CONTENT_LENGTH = 2000;
const MAX_THREAD_NAME_LENGTH = 100;
const EMPTY_BODY = "(本文なし)";

/**
 * イベントに応じて Discord に送信するメッセージコンテンツを生成する。対象外のイベントは null
 */
export function buildContent(event: WebhookEvent): string | null {
  const section = buildSection(event);
  if (section === null) {
    return null;
  }
  return truncate(`${event.sender}\n${section}`, MAX_CONTENT_LENGTH);
}

function buildSection({
  name,
  action,
  target,
  commentBody,
  reviewBody,
}: WebhookEvent): string | null {
  switch (`${name}.${action}`) {
    case "issues.opened":
    case "pull_request.opened":
      return `## Open\n${target.body || EMPTY_BODY}`;
    case "issue_comment.created":
      return `## Message\n${commentBody || EMPTY_BODY}`;
    case "pull_request_review.submitted":
      return `## Review Comment\n${reviewBody || EMPTY_BODY}`;
    case "issues.closed":
    case "pull_request.closed":
      return "## Close\nこのスレッドはクローズされました";
    default:
      return null;
  }
}

/**
 * Discord スレッド名を生成する
 */
export function buildThreadName({ target }: WebhookEvent): string {
  return `#${target.number} ${target.title}`.slice(0, MAX_THREAD_NAME_LENGTH);
}

/**
 * スレッドを照合するキー。番号はリポジトリごとなので、リポジトリ名と組み合わせる
 */
export function buildThreadKey({ repository, target }: WebhookEvent): string {
  return `${repository}#${target.number}`;
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
