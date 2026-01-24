import { NextResponse } from "next/server";
import { sendToDiscord } from "@/lib/discord/client";
import { buildContent, buildThreadName } from "@/lib/discord/message-builder";
import type { NotifyRequest } from "@/types/github";

// POSTリクエスト: Discordフォーラムに新しいスレッドを作成
export async function POST(request: Request) {
  try {
    const body: NotifyRequest = await request.json();

    // メッセージコンテンツとスレッド名を生成
    const content = buildContent(body);
    const threadName = buildThreadName(body);

    // Discord APIでフォーラムチャンネルにスレッドを作成
    const threadId = "1464510641652891885";
    const response = await sendToDiscord(
      content,
      body.sender,
      threadName,
      threadId,
    );

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
