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

export interface ResolveAddressInput {
  countryCode: string;
  locality?: string | null;
  sublocality?: string | null;
  lat?: number;
  lng?: number;
  address?: string;
}

export type ResolveAddressResult =
  | {
      notServiced: true;
      reason: 'country_not_operated' | 'no_polygons_in_country';
      countryCode: string;
      country?: Country;
    }
  | {
      notServiced?: false;
      country: Country;
      polygon: { id: string; name: string; slug: string | null; confidence: 'exact' | 'partial' } | null;
      candidates: { id: string; name: string; slug: string | null }[];
    };

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

  resolveAddress: (input: ResolveAddressInput) =>
    request<ResolveAddressResult>('/v1/resolve-address', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  offers: (input: { polygonId: string; durationHours: number; pickupAt: string }) => {
    const qs = new URLSearchParams({
      polygonId: input.polygonId,
      durationHours: String(input.durationHours),
      pickupAt: input.pickupAt,
    });
    return request<OffersResult>(`/v1/offers?${qs.toString()}`);
  },

  checkout: (input: CheckoutInput) =>
    request<CheckoutResult>('/v1/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  booking: (id: string) =>
    request<BookingDetail>(`/v1/bookings/${encodeURIComponent(id)}`),
};

export interface CheckoutInput {
  offerKey: string;
  countryCode: string;
  polygonId: string;
  pickupAt: string;
  durationHours: number;
  hoursPerDay?: number[] | null;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  agreedToTerms: true;
}

export interface CheckoutResult {
  bookingId: string;
  clientSecret: string;
  currency: string;
  retailPrice: number;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'started'
  | 'completed'
  | 'settled'
  | 'cancelled'
  | 'refunded'
  | 'no_show';

export interface BookingDetail {
  id: string;
  status: BookingStatus;
  customerEmail: string;
  customerName: string | null;
  countryCode: string;
  polygonId: string;
  polygonName: string;
  vehicleClass: { slug: string; label: string; description: string; seats: string };
  ruleName: string | null;
  pickupAt: string;
  pickupAddress: string;
  durationHours: number;
  hoursPerDay: number[] | null;
  includedKm: number;
  retailPrice: number;
  currency: string;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  stripeClientSecret: string | null;
}

export interface OfferCard {
  offerKey: string;
  ruleId: string;
  ruleName: string | null;
  partnerPhpId: string;
  vehicleClass: { slug: string; label: string; description: string; seats: string };
  hourlyRate: number;
  totalPrice: number;
  currency: string;
  includedKm: number;
  includedKmPerHour: number;
  overageRatePerKm: number;
  marginHours: number;
  minHours: number;
  maxHours: number;
}

export interface OffersResult {
  query: {
    polygonId: string;
    polygonName: string;
    countryCode: string;
    countryName?: string;
    durationHours: number;
    pickupAt: string;
    currency?: string;
    overageRatePerKm?: number;
  };
  offers: OfferCard[];
}

export { ApiError };
