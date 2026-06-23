// Thin typed client against sinaitaxi-hourly-api. The shape mirrors
// src/lib/api.ts in sinaitaxi-esim-web so the team has one mental
// model across both products.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';

class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOpts = RequestInit & { next?: { revalidate?: number } };

const request = async <T>(path: string, init: RequestOpts = {}): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
    cache: init.next ? undefined : 'no-store',
  });
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* non-JSON error body */ }
    const message = (body as { message?: string } | undefined)?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }
  return res.json() as Promise<T>;
};

export interface Country { code: string; name: string; }
export interface Polygon { id: string; name: string; slug: string | null; }
export interface VehicleClass {
  slug: string;
  label: string;
  description: string;
  seats: string;
}

export const api = {
  health: () => request<{ ok: boolean; ts: number; service: string }>('/health'),

  // ── Catalog (Phase 1) ─────────────────────────────────────
  // Revalidates every hour — the storefront caches the country
  // and polygon lists so a customer mid-search doesn't pay the
  // PHP round-trip on every page nav.
  countries: () =>
    request<{ countries: Country[] }>('/v1/catalog/countries', {
      next: { revalidate: 3600 },
    }),
  polygons: (code: string) =>
    request<{ country: Country; polygons: Polygon[] }>(
      `/v1/catalog/countries/${encodeURIComponent(code)}/polygons`,
      { next: { revalidate: 3600 } },
    ),
  vehicleClasses: () =>
    request<{ classes: VehicleClass[] }>('/v1/catalog/vehicle-classes', {
      next: { revalidate: 86400 },
    }),
};

export { ApiError };
