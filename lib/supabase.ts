import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase config (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  _client = createClient(url, key);
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

export async function matchFace(
  queryEmbedding: number[],
  matchThreshold: number = 0.6,
  matchCount: number = 1
) {
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 128) {
    throw new Error('Descriptor must be 128 numbers');
  }
  const vectorStr = '[' + queryEmbedding.join(',') + ']';
  const { data, error } = await getSupabase().rpc('match_face', {
    query_embedding: vectorStr,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  if (error) throw error;
  return (data ?? []) as { id: number; name: string; similarity: number }[];
}
