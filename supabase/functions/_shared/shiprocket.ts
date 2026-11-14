const SR = 'https://apiv2.shiprocket.in/v1/external';
let cached: { token: string; expiry: number } | null = null;
export async function shiprocket(path: string, method = 'GET', body?: unknown): Promise<any> {
  if (!cached || cached.expiry < Date.now()) {
    const response = await fetch(`${SR}/auth/login`, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: Deno.env.get('SHIPROCKET_API_EMAIL'), password: Deno.env.get('SHIPROCKET_API_PASSWORD') }) });
    const data = await response.json();
    if (!response.ok || !data.token) throw new Error('Shiprocket connection unavailable');
    cached = { token: data.token, expiry: Date.now() + 24 * 3600 * 1000 };
  }
  const response = await fetch(`${SR}${path}`, { method, signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cached.token}` }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) { if (response.status === 401) cached = null; throw new Error('Shiprocket rates unavailable'); }
  return data;
}