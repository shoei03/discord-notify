export interface DiscordPayload {
  content?: string;
  thread_name?: string;
  allowed_mentions?: {
    parse: ("roles" | "users" | "everyone")[];
  };
}
