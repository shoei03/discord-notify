import { createClient } from "@supabase/supabase-js";
import type { SaveThreadResult, Thread } from "@/types/database";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
