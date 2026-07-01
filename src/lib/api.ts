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
  // Only declare a JSON content-type when we're actually sending
  // a body — Fastify rejects empty-body POSTs that ship the
  // header with "Body cannot be empty".
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (init.body !== undefined && init.body !== null) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
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

export interface Country { code: string; name: string; polygonCount?: number; }
export interface Polygon { id: string; name: string; slug: string | null; }
export interface VehicleClass {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  vehicleTypeName: string;
  seats: number;        // numeric capacity from PHP
  baggage: number;
  childSeatLimit: number;
  photoUrl: string | null;
  isFeatured: boolean;
}

// Compact representation that travels with an offer card or a
// confirmed booking — includes both the display string (`seats`)
// AND the numeric (`seatsCount`) so UIs can sort/filter.
export interface OfferVehicleClass {
  slug: string;
  label: string;
  description: string;
  seats: string;            // "Up to N seats"
  seatsCount: number;
  baggage: number;
  photoUrl: string | null;
  vehicleTypeName: string;
}

export interface ResolveAddressInput {
  countryCode: string;
  locality?: string | null;
  sublocality?: string | null;
  administrativeArea?: string | null;
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
  vehicleClasses: (input: { featuredOnly?: boolean } = {}) => {
    const qs = input.featuredOnly ? '?featuredOnly=1' : '';
    return request<{ classes: VehicleClass[] }>(`/v1/catalog/vehicle-classes${qs}`, {
      next: { revalidate: 3600 },
    });
  },

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

  destinationContent: (country: string, city: string) =>
    request<{ content: DestinationContent | null }>(
      `/v1/destinations/${encodeURIComponent(country)}/${encodeURIComponent(city)}`,
      { next: { revalidate: 600 } },                         // 10-min ISR
    ),

  featuredDestinations: (limit = 9) =>
    request<{ destinations: FeaturedDestination[] }>(
      `/v1/destinations/featured?limit=${limit}`,
      // 60s ISR so admin toggles surface fast without hammering API.
      { next: { revalidate: 60 } },
    ),

  extras: (partnerPhpId: string) =>
    request<{ childSeats: CheckoutChildSeat[]; customExtras: CheckoutCustomExtra[] }>(
      `/v1/extras?partnerPhpId=${encodeURIComponent(partnerPhpId)}`,
    ),

  applyPromoCode: (input: { code: string; subtotal: number; currency: string }) =>
    request<
      | { ok: true; code: string; discount: number; reason: 'percent' | 'amount' }
      | { ok: false; error: 'not_found' | 'inactive' | 'expired' | 'not_yet_valid' | 'min_amount' | 'currency_mismatch' | 'max_uses' }
    >('/v1/promo-codes/apply', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  cancelBooking: (id: string, reason?: string) =>
    request<{
      ok: true;
      status: 'cancelled' | 'refunded';
      refundAmount: number;
      refundId: string | null;
      policyApplied: 'full_refund' | 'non_refundable';
    }>(`/v1/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? undefined }),
    }),
};

export interface CheckoutInput {
  offerKey: string;
  countryCode: string;
  polygonId: string;
  pickupAt: string;
  durationHours: number;
  hoursPerDay?: number[] | null;
  // Full per-day schedule (date + time + hours). When present the
  // backend stores it on the Booking for the partner's dispatch
  // view; `hoursPerDay` stays in sync as a derived field.
  daySchedule?: { date: string; time: string; hours: number }[] | null;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  // null = "same as customerPhone"
  customerWhatsapp?: string | null;
  customerComments?: string | null;
  hotelRoomNumber?: string | null;
  promoCode?: string | null;
  extras?: { type: 'child_seat' | 'custom'; id: string; quantity: number }[] | null;
  agreedToTerms: true;
}

export interface CheckoutChildSeat { id: string; name: string; price: number; currency: string; }
export interface CheckoutCustomExtra { id: string; name: string; description: string | null; price: number; currency: string; }
export interface BookingExtraLine {
  type: 'child_seat' | 'custom';
  sourceId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
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
  customerPhone: string | null;
  customerWhatsapp: string | null;
  customerComments: string | null;
  hotelRoomNumber: string | null;
  countryCode: string;
  polygonId: string;
  polygonName: string;
  vehicleClass: OfferVehicleClass;
  ruleName: string | null;
  pickupAt: string;
  pickupAddress: string;
  durationHours: number;
  hoursPerDay: number[] | null;
  daySchedule: { date: string; time: string; hours: number }[] | null;
  includedKm: number;
  retailPrice: number;
  promoCode: string | null;
  promoDiscount: number | null;
  extras: BookingExtraLine[];
  extrasTotal: number;
  currency: string;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  refundAmount: number | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleLabel: string | null;
  driverAssignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  kmDriven: number | null;
  overageKm: number | null;
  overageAmount: number | null;
  stripeClientSecret: string | null;
}

export interface OfferCard {
  offerKey: string;
  ruleId: string;
  ruleName: string | null;
  partnerPhpId: string;
  vehicleClass: OfferVehicleClass;
  hourlyRate: number;
  totalPrice: number;
  currency: string;
  includedKm: number;
  includedKmPerHour: number;
  overageRatePerKm: number;
  marginHours: number;
  minHours: number;
  maxHours: number;
  partnerCount: number;
  minimumApplied?: boolean;
  priceLines?: { kind: string; label: string; amount: number }[];
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

export interface Attraction {
  name: string;
  blurb: string;
  durationMin?: number | null;
  photoUrl?: string | null;
}
export interface DestinationTip { title: string; body: string; }
export interface DestinationFaq { question: string; answer: string; }

export interface FeaturedDestination {
  polygonPhpId: string;
  countryCode: string;          // lowercase
  countryName: string;
  citySlug: string;
  title: string | null;
  tagline: string | null;
  heroPhotoUrl: string | null;
}

export interface DestinationContent {
  title: string | null;
  metaDescription: string | null;
  heroPhotoUrl: string | null;
  intro: string | null;
  attractions: Attraction[];
  tips: DestinationTip[];
  faqs: DestinationFaq[];
}

export { ApiError };
