export type Thread = {
  id: string;
  thread_id: string;
  thread_name: string;
  // `owner/repo#番号`。移行前の行は null
  thread_key: string | null;
  created_at: string;
};

// supabase-js の型引数に渡すスキーマ定義。interface だと GenericSchema を満たさないので type にする
export type Database = {
  public: {
    Tables: {
      threads: {
        Row: Thread;
        Insert: {
          id?: string;
          thread_id: string;
          thread_name: string;
          thread_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          thread_name?: string;
          thread_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
