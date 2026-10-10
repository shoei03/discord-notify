import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import { err, ok, type Result, toErrorMessage } from "@/lib/result";
import type { Database, Thread } from "@/types/database";

const REQUEST_TIMEOUT_MS = 10_000;

function createThreadsClient() {
  const { supabaseUrl, supabaseSecretKey } = getEnv();
  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Bun の型では fetch に preconnect が生えているが、supabase-js は呼び出しにしか使わない
    global: { fetch: fetchWithTimeout as typeof fetch },
  });
}

let client: ReturnType<typeof createThreadsClient> | undefined;

function getClient() {
  client ??= createThreadsClient();
  return client;
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeout])
    : timeout;
  return fetch(input, { ...init, signal });
}

/**
 * スレッドを `owner/repo#番号` のキーで探す。
 * キー導入前に保存された行は、スレッド名で探してキーを書き込む（移行が終わったらこのフォールバックを消す）
 */
export async function findThread({
  key,
  legacyName,
}: {
  key: string;
  legacyName: string;
}): Promise<Result<Thread | null>> {
  try {
    const byKey = await getClient()
      .from("threads")
      .select()
      .eq("thread_key", key)
      .maybeSingle();
    if (byKey.error) {
      return err(byKey.error.message);
    }
    if (byKey.data) {
      return ok(byKey.data);
    }

    // 別のキーで使われている行を拾わないよう、キー未設定の行だけを対象にする
    const byName = await getClient()
      .from("threads")
      .select()
      .eq("thread_name", legacyName)
      .is("thread_key", null)
      .limit(1)
      .maybeSingle();
    if (byName.error) {
      return err(byName.error.message);
    }
    if (!byName.data) {
      return ok(null);
    }

    const backfill = await getClient()
      .from("threads")
      .update({ thread_key: key })
      .eq("id", byName.data.id);
    if (backfill.error) {
      // 次回も名前で見つかるので、ここでは失敗扱いにしない
      console.error("Failed to backfill thread_key:", backfill.error.message);
    }
    return ok({ ...byName.data, thread_key: key });
  } catch (error) {
    return err(toErrorMessage(error));
  }
}

export async function saveThread({
  key,
  name,
  threadId,
}: {
  key: string;
  name: string;
  threadId: string;
}): Promise<Result<Thread>> {
  try {
    const { data, error } = await getClient()
      .from("threads")
      .upsert(
        { thread_key: key, thread_name: name, thread_id: threadId },
        { onConflict: "thread_key" },
      )
      .select()
      .single();
    if (error) {
      return err(error.message);
    }
    return ok(data);
  } catch (error) {
    return err(toErrorMessage(error));
  }
}
