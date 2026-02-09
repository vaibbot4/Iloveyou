import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** Only this identity is allowed to pass. Must match setup page NAME. */
const EXPECTED_NAME = 'Vishmish';

/** Require at least 2 reference embeddings for multi-match rule. */
const MIN_REFERENCE_COUNT = 2;
/** Similarity above this counts as "one matching reference". */
const SIM_MATCH_THRESHOLD = 0.88;
/** Best similarity must be at least this when using multi-match. */
const BEST_SIM_MIN_MULTI = 0.92;
/** When only 1 reference exists, require this (very strict). */
const BEST_SIM_MIN_SINGLE = 0.95;

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && !Number.isNaN(x);
}

/** Returns a 128-d vector of finite numbers or null. */
function toValidDescriptor(arr: unknown): number[] | null {
  if (!Array.isArray(arr) || arr.length !== 128) return null;
  const out: number[] = [];
  for (let i = 0; i < 128; i++) {
    const v = arr[i];
    if (!isFiniteNumber(v)) return null;
    out.push(v);
  }
  return out;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== 128 || b.length !== 128) return 0;
  let dot = 0,
    n1 = 0,
    n2 = 0;
  for (let i = 0; i < 128; i++) {
    const x = a[i],
      y = b[i];
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return 0;
    dot += x * y;
    n1 += x * x;
    n2 += y * y;
  }
  const denom = Math.sqrt(n1) * Math.sqrt(n2);
  if (denom === 0 || !Number.isFinite(denom)) return 0;
  return Math.max(-1, Math.min(1, dot / denom));
}

function parseEmbeddingText(s: string | null): number[] | null {
  if (!s || typeof s !== 'string') return null;
  try {
    const parsed = JSON.parse(s);
    return toValidDescriptor(parsed);
  } catch {
    return null;
  }
}

function parseEmbedding(emb: unknown): number[] | null {
  if (Array.isArray(emb)) return toValidDescriptor(emb);
  if (typeof emb === 'string') return parseEmbeddingText(emb);
  return null;
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  let body: { descriptor?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const descriptor = toValidDescriptor(body?.descriptor);
  if (!descriptor) {
    return NextResponse.json(
      { error: 'descriptor must be an array of exactly 128 finite numbers' },
      { status: 400 }
    );
  }

  const supabase = createClient(url, key);

  type Row = { id: number; name: string; embedding?: unknown; embedding_text?: string | null };
  let list: Row[] = [];

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_identities_with_embeddings');
  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    list = (rpcData as { id: number; name: string; embedding_text: string | null }[]).map((r) => ({
      id: r.id,
      name: r.name,
      embedding_text: r.embedding_text,
    }));
  } else {
    const { data: tableData, error: tableError } = await supabase
      .from('identities')
      .select('id, name, embedding');
    if (tableError) {
      return NextResponse.json(
        { error: 'Failed to load identities', detail: tableError.message, rpcError: rpcError?.message },
        { status: 500 }
      );
    }
    list = (tableData ?? []) as Row[];
  }

  // Only consider the expected identity (Vishmish)
  const allowed = list.filter((r) => r.name === EXPECTED_NAME);

  const validEmbeddings: number[][] = [];
  for (const row of allowed) {
    const emb =
      row.embedding_text != null ? parseEmbeddingText(row.embedding_text) : parseEmbedding(row.embedding);
    if (emb) validEmbeddings.push(emb);
  }

  // No valid references => never match
  if (validEmbeddings.length === 0) {
    return NextResponse.json({
      match: false,
      bestSimilarity: -1,
      matchCount: 0,
      comparedWith: 0,
      reason: 'no_valid_references',
    });
  }

  let bestSimilarity = -1;
  let matchCount = 0;
  for (const emb of validEmbeddings) {
    const sim = cosineSimilarity(descriptor, emb);
    if (sim > bestSimilarity) bestSimilarity = sim;
    if (sim >= SIM_MATCH_THRESHOLD) matchCount += 1;
  }

  const useMultiRule = validEmbeddings.length >= MIN_REFERENCE_COUNT;
  const match = useMultiRule
    ? bestSimilarity >= BEST_SIM_MIN_MULTI && matchCount >= MIN_REFERENCE_COUNT
    : bestSimilarity >= BEST_SIM_MIN_SINGLE;

  return NextResponse.json({
    match: match === true,
    bestSimilarity,
    matchCount,
    comparedWith: validEmbeddings.length,
    threshold: SIM_MATCH_THRESHOLD,
    bestMin: useMultiRule ? BEST_SIM_MIN_MULTI : BEST_SIM_MIN_SINGLE,
  });
}
