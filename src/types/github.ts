export const SUPPORTED_EVENTS = [
  "issues",
  "pull_request",
  "issue_comment",
  "pull_request_review",
] as const;

export type GitHubEventName = (typeof SUPPORTED_EVENTS)[number];

export interface IssueOrPullRequest {
  number: number;
  title: string;
  body: string | null;
}

/**
 * 検証済みの Webhook イベント。issue と pull_request の違いは target に吸収する
 */
export interface WebhookEvent {
  name: GitHubEventName;
  action: string;
  repository: string;
  sender: string;
  target: IssueOrPullRequest;
  // comment / review を持つイベントのときだけ入る
  commentBody?: string | null;
  reviewBody?: string | null;
}
