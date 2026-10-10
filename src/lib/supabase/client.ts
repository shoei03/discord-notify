import { createClient } from "@supabase/supabase-js";
import type { SaveThreadResult, Thread } from "@/types/database";

export interface GetThreadResult {
  success: boolean;
  data?: Thread;
  error?: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function saveThread(
  threadId: string,
  threadName: string,
): Promise<SaveThreadResult> {
  try {
    const { data, error } = await supabase
      .from("threads")
      .upsert(
        { thread_id: threadId, thread_name: threadName },
        { onConflict: "thread_id" },
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as Thread };
  } catch (error) {
    console.error("Supabase exception:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function getThreadByName(
  threadName: string,
): Promise<GetThreadResult> {
  try {
    const { data, error } = await supabase
      .from("threads")
      .select()
      .eq("thread_name", threadName)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - thread not found
        return { success: true, data: undefined };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data: data as Thread };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
