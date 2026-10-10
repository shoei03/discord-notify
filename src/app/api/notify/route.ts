import { NextResponse } from "next/server";
import { sendToDiscord } from "@/lib/discord/client";
import { buildContent, buildThreadName } from "@/lib/discord/message-builder";
import { verifySignature } from "@/lib/github/verify-signature";
import { getThreadByName, saveThread } from "@/lib/supabase/client";
import type { NotifyRequest } from "@/types/github";

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

// POSTリクエスト: Discordフォーラムに新しいスレッドを作成
export async function POST(request: Request) {
  try {
    if (!GITHUB_WEBHOOK_SECRET) {
      console.error("GITHUB_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }

    // GitHub からのリクエストであることを署名で検証
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifySignature(rawBody, signature, GITHUB_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Webhook 登録時の疎通確認
    if (request.headers.get("x-github-event") === "ping") {
      return NextResponse.json({ message: "pong" });
    }

    const body: NotifyRequest = JSON.parse(rawBody);

    // メッセージコンテンツとスレッド名を生成
    const content = buildContent(body);

    // 対応していない action の場合は処理を終了
    if (content === null) {
      return NextResponse.json(
        { message: `Unsupported action: ${body.action}` },
        { status: 200 },
      );
    }

    const threadName = buildThreadName(body);

    // DBからthreadNameでスレッドを検索
    // 検索に失敗したまま進むと重複スレッドを作るので、500 を返して GitHub に再送させる
    const existingThread = await getThreadByName(threadName);
    if (!existingThread.success) {
      console.error("Failed to look up thread:", existingThread.error);
      return NextResponse.json(
        { error: "Failed to look up thread" },
        { status: 500 },
      );
    }
    const threadId = existingThread.data?.thread_id;

    // Discord APIでフォーラムチャンネルにスレッドを作成（または既存スレッドに送信）
    const response = await sendToDiscord(content, threadName, threadId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to send to Discord", details: errorText },
        { status: response.status },
      );
    }

    const thread = await response.json();
    console.log("Discord API response:", JSON.stringify(thread, null, 2));

    if (!threadId) {
      // 新規スレッドの場合のみDBに保存
      const savedThreadName = thread.name || threadName;
      const savedThreadId = thread.channel_id;
      const dbResult = await saveThread(savedThreadId, savedThreadName);
      if (!dbResult.success) {
        console.error("Failed to save thread to database:", dbResult.error);
      }

      return NextResponse.json({
        success: true,
        threadId: savedThreadId,
        threadName: savedThreadName,
        dbSaved: dbResult.success,
        dbError: dbResult.error,
      });
    }

    return NextResponse.json({
      success: true,
      threadId: threadId,
      threadName: threadName,
    });
  } catch (error) {
    console.error("Error creating Discord thread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
