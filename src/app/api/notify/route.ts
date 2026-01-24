import { NextResponse } from "next/server";
import { sendToDiscord } from "@/lib/discord/client";
import { buildContent, buildThreadName } from "@/lib/discord/message-builder";
import type { NotifyRequest } from "@/types/github";

// POSTリクエスト: Discordフォーラムに新しいスレッドを作成
export async function POST(request: Request) {
  try {
    const body: NotifyRequest = await request.json();
    const { action, comment, review, sender } = body;
    const openData = body.issue ?? body.pull_request;

    if (!openData) {
      return NextResponse.json(
        { error: "Issue or Pull Request is required" },
        { status: 400 },
      );
    }

    // メッセージコンテンツとスレッド名を生成
    const content = buildContent(action, comment, review, sender, openData);
    const threadName = buildThreadName(openData);

    // Discord APIでフォーラムチャンネルにスレッドを作成
    const threadId = "1464510641652891885";
    const response = await sendToDiscord(content, threadName, threadId);

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Failed to create thread", details: errorData },
        { status: response.status },
      );
    }

    const thread = await response.json();

    return NextResponse.json({
      success: true,
      threadId: thread.id,
      threadName: thread.name,
    });
  } catch (error) {
    console.error("Error creating Discord thread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
