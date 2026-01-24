import type { Issue, PullRequest } from "@/types/github";

type Comment = { body: string } | undefined;
type Review = { body: string } | undefined;

/**
 * GitHub Webhook の action に応じて Discord に送信するメッセージコンテンツを生成する
 */
export function buildContent(
  action: string,
  comment: Comment,
  review: Review,
  openData: Issue | PullRequest,
): string {
  switch (action) {
    case "closed":
      return "## Close\nこのスレッドはクローズされました";
    case "edited":
      return "コメントが編集されました";
    case "created":
      return comment?.body
        ? `## コメント\n${comment.body}`
        : `## スレッドの作成\n${openData.body}`;
    case "submitted":
      return `## レビューコメント\n${review?.body}`;
    default:
      return "";
  }
}

/**
 * Discord スレッド名を生成する
 */
export function buildThreadName(openData: Issue | PullRequest): string {
  return `[${openData.title}](${openData.url} "${openData.title}")`;
}
