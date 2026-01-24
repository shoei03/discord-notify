import { NextResponse } from "next/server";

const DISCORD_FORUM_CHANNEL_ID = process.env.DISCORD_FORUM_CHANNEL_ID;

interface NotifyRequest {
	title: string;
	content: string;
}

async function sendToDiscord(
	title: string,
	content: string,
	threadId?: string,
): Promise<Response> {
	const url = threadId
		? `${DISCORD_FORUM_CHANNEL_ID}?wait=true&thread_id=${threadId}`
		: `${DISCORD_FORUM_CHANNEL_ID}?wait=true`;

	const payload = threadId
		? { content }
		: { thread_name: title, content };

	return fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
}

// POSTリクエスト: Discordフォーラムに新しいスレッドを作成
export async function POST(request: Request) {
	try {
		// 環境変数のチェック
		if (!DISCORD_FORUM_CHANNEL_ID) {
			return NextResponse.json(
				{ error: "Discord credentials not configured" },
				{ status: 500 },
			);
		}

		const body: NotifyRequest = await request.json();

		// 必須フィールドのバリデーション
		if (!body.title || !body.content) {
			return NextResponse.json(
				{ error: "title and content are required" },
				{ status: 400 },
			);
		}

		// Discord APIでフォーラムチャンネルにスレッドを作成
		const thread_id = "1464510641652891885";
		const response = await sendToDiscord(body.title, body.content, thread_id);

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