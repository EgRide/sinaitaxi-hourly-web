// Thin typed client against sinaitaxi-hourly-api. The shape
// mirrors src/lib/api.ts in sinaitaxi-esim-web so the team has
// one mental model across both products.
//
// All endpoints are populated in later phases; for Phase 0 we
// expose only the `health` ping so we can prove the storefront
// can reach the API end-to-end.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';

class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

const request = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
    // Storefront pages opt in to revalidate semantics per route
    // (`fetch(..., { next: { revalidate: 60 } })`). The default
    // here is "no cache" so server actions don't accidentally
    // serve stale data.
    cache: 'no-store',
  });
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* non-JSON error body */ }
    const message = (body as { message?: string } | undefined)?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }
  return res.json() as Promise<T>;
};

export const api = {
  health: () => request<{ ok: boolean; ts: number; service: string }>('/health'),
};

export { ApiError };
