// Typed partner-side client. Maintains the JWT in localStorage
// and attaches it as Authorization: Bearer to every request.
//
// For v1 we use localStorage (simpler than httpOnly cookies and
// fine for the partner traffic shape). On 401 we clear the token
// and let the caller redirect to /partner/login.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';

const TOKEN_KEY = 'sinaitaxi-hourly:partner-jwt';

export const partnerSession = {
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

class PartnerApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'PartnerApiError';
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const token = partnerSession.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* non-JSON */ }
    const message = (body as { message?: string; error?: string } | undefined)?.message
      ?? (body as { error?: string } | undefined)?.error
      ?? `Request failed (${res.status})`;
    if (res.status === 401) partnerSession.clear();
    throw new PartnerApiError(res.status, message, body);
  }
  return res.json() as Promise<T>;
};

export interface PartnerIdentity {
  phpAdminId: string;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface PartnerRulePrice {
  vehicleClass: string;
  hourlyRate: number;
  includedKmPerHour: number;
}

export interface PartnerRule {
  id: string;
  name: string | null;
  currency: string;
  active: boolean;
  validFrom: string | null;
  validTo: string | null;
  marginHours: number;
  minHours: number;
  maxHours: number;
  polygonPhpIds: string[];
  prices: PartnerRulePrice[];
  createdAt?: string;
  updatedAt?: string;
}

export type PartnerRuleInput = Omit<PartnerRule, 'id' | 'createdAt' | 'updatedAt'>;

export interface PartnerBookingRow {
  id: string;
  status: string;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  countryCode: string;
  polygonId: string;
  polygonName: string;
  vehicleClass: string;
  pickupAt: string;
  pickupAddress: string;
  durationHours: number;
  hoursPerDay: number[] | null;
  includedKm: number;
  retailPrice: number;
  wholesalePrice: number;
  currency: string;
  ruleName: string | null;
  createdAt: string;
}

export const partnerApi = {
  login: (input: { email: string; password: string }) =>
    request<{ token: string; partner: PartnerIdentity }>('/v1/partner/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () => request<{ ok: true }>('/v1/partner/auth/logout', { method: 'POST' }),

  me: () => request<{ partner: PartnerIdentity }>('/v1/partner/me'),

  rules: () => request<{ rules: PartnerRule[] }>('/v1/partner/rules'),
  rule:  (id: string) => request<{ rule: PartnerRule }>(`/v1/partner/rules/${encodeURIComponent(id)}`),
  createRule: (input: PartnerRuleInput) =>
    request<{ id: string }>('/v1/partner/rules', { method: 'POST', body: JSON.stringify(input) }),
  updateRule: (id: string, input: Partial<PartnerRuleInput>) =>
    request<{ id: string }>(`/v1/partner/rules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteRule: (id: string) =>
    request<{ ok: true }>(`/v1/partner/rules/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  bookings: () => request<{ bookings: PartnerBookingRow[] }>('/v1/partner/bookings'),
};

export { PartnerApiError };
