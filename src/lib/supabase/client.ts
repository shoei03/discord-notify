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
  console.log("saveThread called with:", { threadId, threadName });
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "set" : "NOT SET");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "NOT SET");

  try {
    const { data, error } = await supabase
      .from("threads")
      .upsert(
        { thread_id: threadId, thread_name: threadName },
        { onConflict: "thread_id" },
      )
      .select()
      .single();

    console.log("Supabase response - data:", data, "error:", error);

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
