import { NextResponse } from "next/server";

const DISCORD_FORUM_CHANNEL_ID = process.env.DISCORD_FORUM_CHANNEL_ID;

interface NotifyRequest {
	issue?: Issue;
  pull_request?: PullRequest;
}

interface Issue {
  url: string;
  number: string;
  title: string;
  state: string;
  body?: string;
}

interface PullRequest {
  url: string;
  number: string;
  title: string;
  state: string;
  body?: string;
}

async function sendToDiscord(
	openData: Issue | PullRequest,
	threadId?: string,
): Promise<Response> {
	const url = threadId
		? `${DISCORD_FORUM_CHANNEL_ID}?wait=true&thread_id=${threadId}`
		: `${DISCORD_FORUM_CHANNEL_ID}?wait=true`;

	const payload = threadId
		? { content: openData.body }
		: { thread_name: `#${openData.number}#${openData.title}`, content: openData.body };
	return fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
}

// POSTリクエスト: Discordフォーラムに新しいスレッドを作成
export async function POST(request: Request) {
	try {
		const body: NotifyRequest = await request.json();
	  const openData = body.issue ?? body.pull_request;

		if (!openData) {
			return NextResponse.json(
				{ error: "Issue or Pull Request is required" },
				{ status: 400 },
			);
		}

		// Discord APIでフォーラムチャンネルにスレッドを作成
		const thread_id = "1464510641652891885";
		const response = await sendToDiscord(openData, thread_id);

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