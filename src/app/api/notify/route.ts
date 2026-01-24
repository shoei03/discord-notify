import { NextResponse } from "next/server";
import { sendToDiscord } from "@/lib/discord/client";
import { buildContent, buildThreadName } from "@/lib/discord/message-builder";
import { saveThread, getThreadByName } from "@/lib/supabase/client";
import type { NotifyRequest } from "@/types/github";

// POSTリクエスト: Discordフォーラムに新しいスレッドを作成
export async function POST(request: Request) {
  try {
    const body: NotifyRequest = await request.json();

    // メッセージコンテンツとスレッド名を生成
    const content = buildContent(body);
    const threadName = buildThreadName(body);

    // DBからthreadNameでスレッドを検索
    const existingThread = await getThreadByName(threadName);
    const threadId = existingThread.data?.thread_id;

    // Discord APIでフォーラムチャンネルにスレッドを作成（または既存スレッドに送信）
    const response = await sendToDiscord(content, threadName, threadId);

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Failed to create thread", details: errorData },
        { status: response.status },
      );
    }

    const thread = await response.json();
    console.log("Discord API response:", JSON.stringify(thread, null, 2));

    // DB保存（thread.nameがない場合は生成したthreadNameを使用）
    const savedThreadName = thread.name || threadName;
    const savedThreadId = thread.id || thread.channel_id;
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
  } catch (error) {
    console.error("Error creating Discord thread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
