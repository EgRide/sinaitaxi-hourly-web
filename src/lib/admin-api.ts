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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
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

  csvDownloadUrl: (filters: AdminBookingsFilters = {}): string =>
    `${BASE}/v1/admin/bookings${buildQuery({ ...filters, format: 'csv' })}`,
};

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
