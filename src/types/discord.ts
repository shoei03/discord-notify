export interface DiscordPayload {
  content?: string;
  thread_name?: string;
  allowed_mentions?: {
    parse: ("roles" | "users" | "everyone")[];
  };
}

// wait=true のときに返るメッセージのうち、使うフィールドだけ
export interface DiscordMessage {
  channel_id: string;
}
