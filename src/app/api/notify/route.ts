import { NextResponse } from "next/server";

const DISCORD_FORUM_CHANNEL_ID = process.env.DISCORD_FORUM_CHANNEL_ID;

interface NotifyRequest {
  action: string;
	issue?: Issue;
  pull_request?: PullRequest;
}

interface Issue {
  url: string;
  number: string;
  title: string;
  state: string;
  body?: string;
  comment?: {
    body: string;
  };
}

interface PullRequest {
  url: string;
  number: string;
  title: string;
  state: string;
  body?: string;
  comment?: {
    body: string;
  };
}

async function sendToDiscord(
	action: string,
	openData: Issue | PullRequest,
	threadId?: string,
): Promise<Response> {
	const url = threadId
		? `${DISCORD_FORUM_CHANNEL_ID}?wait=true&thread_id=${threadId}`
		: `${DISCORD_FORUM_CHANNEL_ID}?wait=true`;

  let content = "";
  const thread_name = `[${openData.title}](${openData.url} "${openData.title}")`;
  if (action === "closed") {
    content = "This thread has been closed.";
  } else if (action === "created") {
	  content = openData.comment?.body ?? "";
  }

	const payload = threadId
		? { content }
		: { thread_name: thread_name, content };

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
    const action = body.action;
	  const openData = body.issue ?? body.pull_request;

		if (!openData) {
			return NextResponse.json(
				{ error: "Issue or Pull Request is required" },
				{ status: 400 },
			);
		}

		// Discord APIでフォーラムチャンネルにスレッドを作成
		const thread_id = "1464510641652891885";
		const response = await sendToDiscord(action, openData, thread_id);

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