import { describe, expect, test } from "bun:test";
import type { WebhookEvent } from "@/types/github";
import {
  buildContent,
  buildThreadKey,
  buildThreadName,
} from "./message-builder";

const base: WebhookEvent = {
  name: "issues",
  action: "opened",
  repository: "octo/repo",
  sender: "octocat",
  target: { number: 1, title: "Title", body: null },
};

describe("buildContent", () => {
  test("未対応の action は null を返す", () => {
    expect(buildContent({ ...base, action: "labeled" })).toBeNull();
  });

  test("対応する action でも、イベントが違えば null を返す", () => {
    // 例: label イベントの created で投稿しない
    expect(
      buildContent({ ...base, name: "issues", action: "created" }),
    ).toBeNull();
  });

  test("本文が null の Issue はフォールバック文言を入れる", () => {
    expect(buildContent(base)).toBe("octocat\n## Open\n(本文なし)");
  });

  test("コメントなしのレビューはフォールバック文言を入れる", () => {
    const event: WebhookEvent = {
      ...base,
      name: "pull_request_review",
      action: "submitted",
      reviewBody: null,
    };
    expect(buildContent(event)).toBe("octocat\n## Review Comment\n(本文なし)");
  });

  test("2000 文字を超える本文は切り詰める", () => {
    const event: WebhookEvent = {
      ...base,
      name: "issue_comment",
      action: "created",
      commentBody: "a".repeat(3000),
    };
    const content = buildContent(event);
    expect(content).toHaveLength(2000);
    expect(content?.endsWith("…")).toBe(true);
  });
});

describe("buildThreadName", () => {
  test("100 文字に切り詰める", () => {
    const name = buildThreadName({
      ...base,
      target: { ...base.target, title: "x".repeat(200) },
    });
    expect(name).toHaveLength(100);
    expect(name.startsWith("#1 ")).toBe(true);
  });
});

describe("buildThreadKey", () => {
  test("番号が同じでもリポジトリが違えば別のキーになる", () => {
    expect(buildThreadKey(base)).toBe("octo/repo#1");
    expect(buildThreadKey({ ...base, repository: "other/repo" })).not.toBe(
      buildThreadKey(base),
    );
  });
});
