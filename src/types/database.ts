export interface Thread {
  id: string;
  thread_id: string;
  thread_name: string;
  created_at: string;
}

export interface SaveThreadResult {
  success: boolean;
  data?: Thread;
  error?: string;
}
