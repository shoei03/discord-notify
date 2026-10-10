import { describe, expect, test } from "bun:test";
import { isSupportedEvent, parseWebhookEvent } from "./parse-event";

const payload = {
  action: "opened",
  repository: { full_name: "octo/repo" },
  sender: { login: "octocat" },
  issue: { number: 1, title: "Title", body: "Body" },
};

describe("isSupportedEvent", () => {
  test("allowlist のイベントだけ受け付ける", () => {
    expect(isSupportedEvent("issues")).toBe(true);
    expect(isSupportedEvent("label")).toBe(false);
    expect(isSupportedEvent(null)).toBe(false);
  });
});

describe("parseWebhookEvent", () => {
  test("issue を target に正規化する", () => {
    const result = parseWebhookEvent("issues", payload);
    expect(result).toEqual({
      ok: true,
      value: {
        name: "issues",
        action: "opened",
        repository: "octo/repo",
        sender: "octocat",
        target: { number: 1, title: "Title", body: "Body" },
        commentBody: undefined,
        reviewBody: undefined,
      },
    });
  });

  test("pull_request も target に正規化し、null の本文を保つ", () => {
    const { issue: _, ...rest } = payload;
    const result = parseWebhookEvent("pull_request_review", {
      ...rest,
      action: "submitted",
      pull_request: { number: 2, title: "PR", body: null },
      review: { body: null },
    });
    expect(result.ok && result.value.target.number).toBe(2);
    expect(result.ok && result.value.reviewBody).toBeNull();
  });

  test.each([
    ["オブジェクトでない", null],
    ["配列", []],
    ["action が無い", { ...payload, action: undefined }],
    ["repository が無い", { ...payload, repository: undefined }],
    ["sender.login が数値", { ...payload, sender: { login: 1 } }],
    ["issue も pull_request も無い", { ...payload, issue: undefined }],
    ["number が文字列", { ...payload, issue: { number: "1", title: "T" } }],
  ])("不正な payload を拒否する: %s", (_, invalid) => {
    expect(parseWebhookEvent("issues", invalid).ok).toBe(false);
  });
});
