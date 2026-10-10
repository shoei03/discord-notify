import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { isSupportedEvent, parseWebhookEvent } from "@/lib/github/parse-event";
import { verifySignature } from "@/lib/github/verify-signature";
import { notify } from "@/lib/notify/notify";

// GitHub Webhook を受けて Discord フォーラムに投稿する
export async function POST(request: Request) {
  try {
    const { githubWebhookSecret } = getEnv();

    // GitHub からのリクエストであることを署名で検証
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifySignature(rawBody, signature, githubWebhookSecret)) {
      return jsonError("Invalid signature", 401);
    }

    const eventName = request.headers.get("x-github-event");
    // Webhook 登録時の疎通確認
    if (eventName === "ping") {
      return NextResponse.json({ message: "pong" });
    }
    if (!isSupportedEvent(eventName)) {
      return NextResponse.json({ message: `Unsupported event: ${eventName}` });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    const event = parseWebhookEvent(eventName, payload);
    if (!event.ok) {
      return jsonError(`Invalid payload: ${event.error}`, 400);
    }

    const outcome = await notify(event.value);
    switch (outcome.kind) {
      case "ignored":
        return NextResponse.json({ message: outcome.reason });
      case "sent":
        return NextResponse.json({
          threadId: outcome.threadId,
          threadName: outcome.threadName,
          created: outcome.created,
        });
      case "error":
        // 詳細はログにだけ出し、レスポンスには含めない
        console.error(`Notify failed at ${outcome.stage}:`, outcome.error);
        return outcome.stage === "lookup"
          ? jsonError("Failed to look up thread", 500)
          : jsonError("Failed to send to Discord", 502);
    }
  } catch (error) {
    console.error("Unexpected error in /api/notify:", error);
    return jsonError("Internal server error", 500);
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
