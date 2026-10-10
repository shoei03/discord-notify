import { err, ok, type Result } from "@/lib/result";
import {
  type GitHubEventName,
  type IssueOrPullRequest,
  SUPPORTED_EVENTS,
  type WebhookEvent,
} from "@/types/github";

type JsonObject = Record<string, unknown>;

export function isSupportedEvent(name: string | null): name is GitHubEventName {
  return (SUPPORTED_EVENTS as readonly string[]).includes(name ?? "");
}

/**
 * 署名検証済みの payload を、使うフィールドだけ検証して WebhookEvent にする
 */
export function parseWebhookEvent(
  name: GitHubEventName,
  payload: unknown,
): Result<WebhookEvent> {
  if (!isObject(payload)) {
    return err("payload is not an object");
  }
  const { action, repository, sender, issue, pull_request, comment, review } =
    payload;

  if (typeof action !== "string") {
    return err("action is missing");
  }
  if (!isObject(repository) || typeof repository.full_name !== "string") {
    return err("repository.full_name is missing");
  }
  if (!isObject(sender) || typeof sender.login !== "string") {
    return err("sender.login is missing");
  }
  const target = parseTarget(issue) ?? parseTarget(pull_request);
  if (!target) {
    return err("issue or pull_request is missing");
  }

  return ok({
    name,
    action,
    repository: repository.full_name,
    sender: sender.login,
    target,
    commentBody: isObject(comment) ? toBody(comment.body) : undefined,
    reviewBody: isObject(review) ? toBody(review.body) : undefined,
  });
}

function parseTarget(value: unknown): IssueOrPullRequest | undefined {
  if (
    !isObject(value) ||
    typeof value.number !== "number" ||
    typeof value.title !== "string"
  ) {
    return undefined;
  }
  return { number: value.number, title: value.title, body: toBody(value.body) };
}

function toBody(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
