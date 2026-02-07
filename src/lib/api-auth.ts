import { NextRequest } from 'next/server';
import { createClient, createServiceClient } from './supabase-server';
import { createHash } from 'crypto';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): string {
  const chars = '0123456789abcdef';
  let key = 'ctx_';
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export async function authenticateRequest(request: NextRequest): Promise<{ userId: string } | null> {
  // Try cookie auth first
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { userId: user.id };
  } catch {
    // Cookie auth failed, try API key
  }

  // Try API key auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ctx_')) return null;

  const key = authHeader.slice(7); // Remove "Bearer "
  const keyHash = hashApiKey(key);

  const serviceClient = createServiceClient();
  const { data } = await serviceClient
    .from('api_keys')
    .select('user_id')
    .eq('key', keyHash)
    .single();

  if (!data) return null;

  // Update last_used_at (fire and forget)
  serviceClient.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key', keyHash).then(() => {});

  return { userId: data.user_id };
}
