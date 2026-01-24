import { NextResponse } from "next/server";

const DISCORD_FORUM_CHANNEL_ID = process.env.DISCORD_FORUM_CHANNEL_ID;

interface NotifyRequest {
	issue?: Issue;
}

interface Issue {
  url: string;
  number: string;
  title: string;
  state: string;
  body?: string;
}

async function sendToDiscord(
	issue: Issue,
	threadId?: string,
): Promise<Response> {
	const url = threadId
		? `${DISCORD_FORUM_CHANNEL_ID}?wait=true&thread_id=${threadId}`
		: `${DISCORD_FORUM_CHANNEL_ID}?wait=true`;

	const payload = threadId
		? { content: issue.body }
		: { thread_name: `#${issue.number}#${issue.title}`, content: issue.body };

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
	  const issue = body.issue;

		if (!issue) {
			return NextResponse.json(
				{ error: "Issue is required" },
				{ status: 400 },
			);
		}

		// Discord APIでフォーラムチャンネルにスレッドを作成
		const thread_id = "1464510641652891885";
		const response = await sendToDiscord(issue, thread_id);

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