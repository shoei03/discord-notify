import type { Issue, PullRequest } from "@/types/github";

type Comment = { body: string } | undefined;
type Review = { body: string } | undefined;
type Sender = { login: string; avatar_url: string } | undefined;

/**
 * GitHub Webhook の action に応じて Discord に送信するメッセージコンテンツを生成する
 */
export function buildContent(
  action: string,
  comment: Comment,
  review: Review,
  sender: Sender,
  openData: Issue | PullRequest,
): string {
  let content = `**${sender?.login}** \n`;
  switch (action) {
    case "opened":
      content += `## Open\n${openData.body}`;
      break;
    case "created":
      content += `## Message\n${comment?.body}`;
      break;
    case "edited":
      content += "コメントが編集されました";
      break;
    case "submitted":
      content += `## Review Comment\n${review?.body}`;
      break;
    case "closed":
      content += "## Close\nこのスレッドはクローズされました";
      break;
    default:
      content = "";
  }
  return content;
}

/**
 * Discord スレッド名を生成する
 */
export function buildThreadName(openData: Issue | PullRequest): string {
  return `[${openData.title}](${openData.url} "${openData.title}")`;
}
