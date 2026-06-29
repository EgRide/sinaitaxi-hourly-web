// Admin-side typed client. Same PHP login flow as partner-api,
// but the JWT lives under a separate storage key + the backend
// gates by ADMIN_EMAILS allowlist.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';
const TOKEN_KEY = 'sinaitaxi-hourly:admin-jwt';

export const adminSession = {
  get token(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

class AdminApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'AdminApiError';
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  // Fastify rejects POST/PATCH calls that declare Content-Type:
  // application/json but ship no body with "Body cannot be empty".
  // Only set the JSON content-type when we're actually sending one.
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (init.body !== undefined && init.body !== null) {
    headers['Content-Type'] = 'application/json';
  }
  const token = adminSession.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* non-JSON */ }
    const message = (body as { message?: string; error?: string } | undefined)?.message
      ?? (body as { error?: string } | undefined)?.error
      ?? `Request failed (${res.status})`;
    if (res.status === 401) adminSession.clear();
    throw new AdminApiError(res.status, message, body);
  }
  return res.json() as Promise<T>;
};

export interface AdminIdentity {
  phpAdminId: string;
  fullName: string;
  email: string;
}

export interface AdminStats {
  statusCounts: { pending: number; confirmed: number; started: number; completed: number; cancelled: number };
  todayPickups: number;
  monthBookings: number;
  monthGrossRevenue: number;
}

export interface AdminBookingRow {
  id: string;
  status: string;
  createdAt: string;
  pickupAt: string;
  countryCode: string;
  polygonId: string;
  polygonName: string;
  vehicleClass: string;
  durationHours: number;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  partnerId: string | null;
  ruleName: string | null;
  retailPrice: number;
  wholesalePrice: number;
  currency: string;
  refundAmount: number | null;
}

export interface AdminBookingDetail extends AdminBookingRow {
  updatedAt: string;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  hoursPerDay: number[] | null;
  includedKm: number;
  ruleId: string | null;
  assignedPartnerId: string | null;
  assignedAt: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleLabel: string | null;
  driverAssignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  odometerStart: number | null;
  odometerEnd: number | null;
  overageKm: number | null;
  overageAmount: number | null;
  overageChargeId: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  refundId: string | null;
  stripePaymentIntent: string;
  stripeCustomerId: string | null;
}

export interface AdminAuditEntry {
  id: string;
  bookingId: string;
  actor: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  meta: unknown;
  createdAt: string;
}

export interface AdminCountry {
  code: string;
  name: string;
  currency: string;
  commissionPct: number;
  overageRatePerKm: number;
  active: boolean;
  updatedAt: string;
}

export type AdminBookingsFilters = {
  status?: string;
  country?: string;
  partnerId?: string;
  customerEmail?: string;
  from?: string;
  to?: string;
};

const buildQuery = (params: Record<string, string | undefined>): string => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
};

export const adminApi = {
  login: (input: { email: string; password: string }) =>
    request<{ token: string; admin: AdminIdentity }>('/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  me: () => request<{ admin: AdminIdentity }>('/v1/admin/me'),

  stats: () => request<AdminStats>('/v1/admin/stats'),

  dashboard: (days = 30) => request<AdminDashboard>(`/v1/admin/stats/dashboard?days=${days}`),

  countryDetail: (code: string, days = 30) =>
    request<AdminCountryDetail>(`/v1/admin/countries/${encodeURIComponent(code)}/detail?days=${days}`),

  bookings: (filters: AdminBookingsFilters = {}) =>
    request<{ bookings: AdminBookingRow[]; count: number }>(`/v1/admin/bookings${buildQuery(filters)}`),

  booking: (id: string) =>
    request<{ booking: AdminBookingDetail; auditLog: AdminAuditEntry[] }>(`/v1/admin/bookings/${encodeURIComponent(id)}`),

  refund: (id: string, input: { amount: number; reason: string }) =>
    request<{ ok: true; refundId: string; amount: number }>(`/v1/admin/bookings/${encodeURIComponent(id)}/refund`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  adminCancel: (id: string, reason?: string) =>
    request<{ ok: true }>(`/v1/admin/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? undefined }),
    }),

  countries: () => request<{ countries: AdminCountry[] }>('/v1/admin/countries'),

  updateCountry: (code: string, patch: Partial<Omit<AdminCountry, 'code' | 'updatedAt'>>) =>
    request<{ ok: true }>(`/v1/admin/countries/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  auditLog: (limit = 100) =>
    request<{ entries: AdminAuditEntry[] }>(`/v1/admin/audit-log?limit=${limit}`),

  promoCodes: () => request<{ codes: AdminPromoCode[] }>('/v1/admin/promo-codes'),

  createPromoCode: (input: AdminPromoCodeInput) =>
    request<{ ok: true; id: string }>('/v1/admin/promo-codes', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updatePromoCode: (id: string, patch: Partial<AdminPromoCodeInput>) =>
    request<{ ok: true }>(`/v1/admin/promo-codes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deactivatePromoCode: (id: string) =>
    request<{ ok: true }>(`/v1/admin/promo-codes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  destinations: () =>
    request<{ destinations: AdminDestinationContent[] }>('/v1/admin/destinations'),

  createDestination: (input: AdminDestinationContentInput) =>
    request<{ ok: true; id: string }>('/v1/admin/destinations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateDestination: (id: string, patch: Partial<AdminDestinationContentInput>) =>
    request<{ ok: true }>(`/v1/admin/destinations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteDestination: (id: string) =>
    request<{ ok: true }>(`/v1/admin/destinations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  seedDestinations: () =>
    request<{ ok: true; upserted: number; slugs: string[] }>('/v1/admin/destinations/seed', {
      method: 'POST',
    }),

  destinationsCoverage: () =>
    request<{ polygons: number; withContent: number; gap: number }>('/v1/admin/destinations/coverage'),

  generateDestinations: (batchSize?: number) =>
    request<{ attempted: number; generated: number; skipped: number; failed: number; durationMs: number }>(
      `/v1/admin/destinations/generate${batchSize ? `?batchSize=${batchSize}` : ''}`,
      { method: 'POST' },
    ),

  autoFeatureDestinations: (limit?: number) =>
    request<{ ok: true; picked: number; cleared: number; slugs: string[] }>(
      `/v1/admin/destinations/auto-feature${limit ? `?limit=${limit}` : ''}`,
      { method: 'POST' },
    ),

  csvDownloadUrl: (filters: AdminBookingsFilters = {}): string =>
    `${BASE}/v1/admin/bookings${buildQuery({ ...filters, format: 'csv' })}`,

  suppliers: () =>
    request<{ suppliers: AdminSupplier[] }>('/v1/admin/suppliers'),

  updateSupplier: (phpId: string, patch: Partial<AdminSupplierPatch>) =>
    request<{ ok: true }>(`/v1/admin/suppliers/${encodeURIComponent(phpId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
};

export interface AdminSupplier {
  partnerPhpId: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  province: string | null;
  phpActive: boolean;                  // PHP-side active flag (read-only here)
  approvedAt: string | null;
  hourlyActive: boolean;               // our override
  commissionPctOverride: number | null;
  notes: string | null;
  overrideUpdatedAt: string | null;
  // insights
  bookingsCount: number;
  revenue: number;
  wholesale: number;
  lastBookingAt: string | null;
}

export interface AdminSupplierPatch {
  hourlyActive: boolean;
  commissionPctOverride: number | null;
  notes: string | null;
}

export interface AdminPromoCode {
  id: string;
  code: string;
  description: string | null;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
  minAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface AdminCountryDetail {
  country: AdminCountry;
  coverage: { totalPolygons: number; activePolygons: number; activeSuppliers: number };
  windowDays: number;
  kpis: {
    revenue:    { current: number; previous: number };
    bookings:   { current: number; previous: number };
    aov:        { current: number; previous: number };
    commission: { current: number; previous: number };
  };
  funnel: Record<string, number>;
  series: { date: string; revenue: number; bookings: number }[];
  topSuppliers: { partnerPhpId: string; bookings: number; revenue: number; wholesale: number }[];
  recentBookings: {
    id: string;
    status: string;
    customerEmail: string;
    customerName: string | null;
    pickupAt: string;
    polygonName: string;
    vehicleClass: string;
    retailPrice: number;
    currency: string;
    partnerPhpId: string | null;
    createdAt: string;
  }[];
}

export interface AdminDashboard {
  windowDays: number;
  kpis: {
    revenue:    { current: number; previous: number };
    bookings:   { current: number; previous: number };
    aov:        { current: number; previous: number };
    commission: { current: number; previous: number };
    todayPickups: number;
    tomorrowPickups: number;
  };
  funnel: {
    pending: number; confirmed: number; started: number;
    completed: number; settled: number;
    cancelled: number; refunded: number; no_show: number;
  };
  series: { date: string; revenue: number; bookings: number }[];
  leaderboards: {
    suppliers:      { partnerPhpId: string; bookings: number; revenue: number; wholesale: number }[];
    polygons:       { phpId: string; name: string; countryCode: string | null; bookings: number; revenue: number }[];
    vehicleClasses: { slug: string; name: string; bookings: number; revenue: number }[];
  };
  activity: {
    id: string; bookingId: string; actor: string; action: string;
    fromStatus: string | null; toStatus: string | null; at: string;
  }[];
  pending: { refundsPending: number; bookingsStuck: number };
  activeStatuses: number;
}

export interface AdminAttraction {
  name: string;
  blurb: string;
  durationMin?: number | null;
  photoUrl?: string | null;
}
export interface AdminTip { title: string; body: string; }
export interface AdminFaq { question: string; answer: string; }

export interface AdminDestinationContent {
  id: string;
  polygonPhpId: string;
  countryCode: string;
  citySlug: string;
  title: string | null;
  metaDescription: string | null;
  heroPhotoUrl: string | null;
  tagline: string | null;
  intro: string | null;
  attractions: AdminAttraction[];
  tips: AdminTip[];
  faqs: AdminFaq[];
  status: 'draft' | 'published';
  source: 'manual' | 'ai_draft';
  isFeatured: boolean;
  sortOrder: number;
  updatedAt: string;
  updatedBy: string | null;
}

export interface AdminDestinationContentInput {
  polygonPhpId: string;
  countryCode: string;
  citySlug: string;
  title?: string | null;
  metaDescription?: string | null;
  heroPhotoUrl?: string | null;
  tagline?: string | null;
  intro?: string | null;
  attractions?: AdminAttraction[] | null;
  tips?: AdminTip[] | null;
  faqs?: AdminFaq[] | null;
  status?: 'draft' | 'published';
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface AdminPromoCodeInput {
  code: string;
  description?: string | null;
  percentOff?: number | null;
  amountOff?: number | null;
  currency?: string | null;
  minAmount?: number | null;
  maxUses?: number | null;
  validFrom?: string | null;          // ISO datetime
  validUntil?: string | null;
  active?: boolean;
}

export { AdminApiError };
