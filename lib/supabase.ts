import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function matchFace(
  queryEmbedding: number[],
  matchThreshold: number = 0.6,
  matchCount: number = 1
) {
  const { data, error } = await supabase.rpc('match_face', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  if (error) throw error;
  return data as { id: number; name: string; similarity: number }[];
}
