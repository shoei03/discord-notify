import { describe, expect, test } from "bun:test";
import type { NotifyRequest } from "@/types/github";
import { buildContent, buildThreadName } from "./message-builder";

const sender = { login: "octocat", avatar_url: "" };
const issue = { url: "", number: 1, title: "Title", state: "open" };

describe("buildContent", () => {
  test("未対応の action は null を返す", () => {
    expect(buildContent({ action: "labeled", sender, issue })).toBeNull();
  });

  test("本文が null の Issue はフォールバック文言を入れる", () => {
    const body: NotifyRequest = {
      action: "opened",
      sender,
      issue: { ...issue, body: null },
    };
    expect(buildContent(body)).toBe("octocat\n## Open\n(本文なし)");
  });

  test("コメントなしのレビューはフォールバック文言を入れる", () => {
    const body: NotifyRequest = {
      action: "submitted",
      sender,
      issue,
      review: { body: null },
    };
    expect(buildContent(body)).toBe("octocat\n## Review Comment\n(本文なし)");
  });

  test("2000 文字を超える本文は切り詰める", () => {
    const body: NotifyRequest = {
      action: "created",
      sender,
      issue,
      comment: { body: "a".repeat(3000) },
    };
    const content = buildContent(body);
    expect(content).toHaveLength(2000);
    expect(content?.endsWith("…")).toBe(true);
  });
});

describe("buildThreadName", () => {
  test("100 文字に切り詰める", () => {
    const name = buildThreadName({
      action: "opened",
      sender,
      issue: { ...issue, title: "x".repeat(200) },
    });
    expect(name).toHaveLength(100);
    expect(name.startsWith("#1 ")).toBe(true);
  });
});
