export interface Issue {
  url: string;
  number: number;
  title: string;
  state: string;
  body?: string | null;
}

export interface PullRequest {
  url: string;
  number: number;
  title: string;
  state: string;
  body?: string | null;
}

export interface NotifyRequest {
  action: string;
  issue?: Issue;
  pull_request?: PullRequest;
  comment?: {
    body: string | null;
  };
  review?: {
    body: string | null;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
}
