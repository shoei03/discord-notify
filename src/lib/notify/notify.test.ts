import { describe, expect, mock, test } from "bun:test";
import { err, ok } from "@/lib/result";
import type { Thread } from "@/types/database";
import type { WebhookEvent } from "@/types/github";
import { type NotifyDeps, notify } from "./notify";

const event: WebhookEvent = {
  name: "issue_comment",
  action: "created",
  repository: "octo/repo",
  sender: "octocat",
  target: { number: 1, title: "Title", body: null },
  commentBody: "hello",
};

const thread: Thread = {
  id: "row-1",
  thread_id: "existing-thread",
  thread_name: "#1 Title",
  thread_key: "octo/repo#1",
  created_at: "",
};

function fakeDeps(overrides: Partial<NotifyDeps> = {}) {
  return {
    findThread: mock(async () => ok<Thread | null>(null)),
    saveThread: mock(async () => ok(thread)),
    sendToDiscord: mock(async () => ok({ threadId: "new-thread" })),
    ...overrides,
  } satisfies NotifyDeps;
}

describe("notify", () => {
  test("未対応のイベントは何も呼ばずに ignored を返す", async () => {
    const deps = fakeDeps();
    const outcome = await notify({ ...event, action: "deleted" }, deps);
    expect(outcome.kind).toBe("ignored");
    expect(deps.findThread).not.toHaveBeenCalled();
    expect(deps.sendToDiscord).not.toHaveBeenCalled();
  });

  test("リポジトリ込みのキーでスレッドを探す", async () => {
    const deps = fakeDeps();
    await notify(event, deps);
    expect(deps.findThread).toHaveBeenCalledWith({
      key: "octo/repo#1",
      legacyName: "#1 Title",
    });
  });

  test("既存スレッドがあればそこに追記し、DB には保存しない", async () => {
    const deps = fakeDeps({
      findThread: mock(async () => ok<Thread | null>(thread)),
    });
    const outcome = await notify(event, deps);
    expect(deps.sendToDiscord).toHaveBeenCalledWith({
      content: "octocat\n## Message\nhello",
      threadName: "#1 Title",
      threadId: "existing-thread",
    });
    expect(deps.saveThread).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      kind: "sent",
      threadId: "existing-thread",
      threadName: "#1 Title",
      created: false,
    });
  });

  test("スレッドが無ければ作成して保存する", async () => {
    const deps = fakeDeps();
    const outcome = await notify(event, deps);
    expect(deps.saveThread).toHaveBeenCalledWith({
      key: "octo/repo#1",
      name: "#1 Title",
      threadId: "new-thread",
    });
    expect(outcome).toMatchObject({
      kind: "sent",
      threadId: "new-thread",
      created: true,
    });
  });

  test("検索に失敗したら Discord に送らない", async () => {
    const deps = fakeDeps({
      findThread: mock(async () => err<Thread | null>("db down")),
    });
    const outcome = await notify(event, deps);
    expect(outcome).toEqual({
      kind: "error",
      stage: "lookup",
      error: "db down",
    });
    expect(deps.sendToDiscord).not.toHaveBeenCalled();
  });

  test("Discord への送信に失敗したら保存しない", async () => {
    const deps = fakeDeps({
      sendToDiscord: mock(async () => err<{ threadId: string }>("500")),
    });
    const outcome = await notify(event, deps);
    expect(outcome).toEqual({ kind: "error", stage: "discord", error: "500" });
    expect(deps.saveThread).not.toHaveBeenCalled();
  });

  test("保存に失敗しても送信済みなので sent を返す", async () => {
    const deps = fakeDeps({
      saveThread: mock(async () => err<Thread>("db down")),
    });
    const outcome = await notify(event, deps);
    expect(outcome).toMatchObject({ kind: "sent", created: true });
  });
});
