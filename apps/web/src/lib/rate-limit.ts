import { NextResponse, type NextRequest } from 'next/server';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

const DEFAULT_MAX_TOKENS = 120;
const DEFAULT_REFILL_RATE = 2;
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const BUCKET_TTL = 10 * 60 * 1000;

let lastCleanup = Date.now();

function cleanupStale() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > BUCKET_TTL) buckets.delete(key);
  }
}

function getClientKey(request: NextRequest): string {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return `key:${apiKey.slice(0, 12)}`;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return `ip:${ip}`;
}

function consumeToken(key: string, maxTokens: number, refillRate: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  cleanupStale();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfter: 0 };
  }

  const waitSeconds = Math.ceil((1 - bucket.tokens) / refillRate);
  return { allowed: false, retryAfter: waitSeconds };
}

export function rateLimit(
  request: NextRequest,
  maxTokens = DEFAULT_MAX_TOKENS,
  refillRate = DEFAULT_REFILL_RATE,
): NextResponse | null {
  const key = getClientKey(request);
  const { allowed, retryAfter } = consumeToken(key, maxTokens, refillRate);

  if (allowed) return null;

  return NextResponse.json(
    { error: { code: 'RATE_LIMITED', message: 'Too many requests', retryAfter } },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  );
}
