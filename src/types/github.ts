export interface Issue {
	url: string;
	number: string;
	title: string;
	state: string;
	body?: string;
}

export interface PullRequest {
	url: string;
	number: string;
	title: string;
	state: string;
	body?: string;
}

export interface NotifyRequest {
	action: string;
	issue?: Issue;
	pull_request?: PullRequest;
	comment?: {
		body: string;
	};
	review?: {
		body: string;
	};
}
