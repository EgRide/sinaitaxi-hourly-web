// SEO landing page per (country, city) — Mozio runs the same
// pattern for organic traffic. Each polygon gets a static-ish
// page describing the rental product there. Wires a city-scoped
// search form so the customer drops straight into pricing.
//
// `params.country` is ISO-2 lowercase. `params.city` is the polygon
// `slug`. We resolve both server-side to confirm the polygon exists.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, MapPin, Car } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { api } from '@/lib/api';

type Params = Promise<{ country: string; city: string }>;

async function resolveCityFromSlug(country: string, city: string) {
  const code = country.toUpperCase();
  try {
    const r = await api.polygons(code);
    const polygon = r.polygons.find(p => (p.slug ?? '').toLowerCase() === city.toLowerCase());
    if (!polygon) return null;
    return { country: r.country, polygon };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country, city } = await params;
  const resolved = await resolveCityFromSlug(country, city);
  if (!resolved) return { title: 'Destination not found' };
  const { country: c, polygon } = resolved;
  return {
    title: `Hourly car rental in ${polygon.name}, ${c.name}`,
    description: `Book a chauffeured car by the hour in ${polygon.name}. Half-day, full-day, or multi-day rentals via the Sinai Taxi marketplace.`,
    alternates: { canonical: `https://hourly.sinaitaxi.com/destinations/${country.toLowerCase()}/${city.toLowerCase()}` },
  };
}

export default async function DestinationPage({ params }: { params: Params }) {
  const { country, city } = await params;
  const resolved = await resolveCityFromSlug(country, city);
  if (!resolved) notFound();
  const { country: c, polygon } = resolved;

  // Build a "quick start" link straight into /search for this polygon
  // with sane defaults (now + 24h, 4 hour rental).
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const pickupAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:00`;
  const quickHref = `/search?countryCode=${c.code}&polygonId=${polygon.id}&pickupAt=${encodeURIComponent(pickupAt)}&durationHours=4`;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">
              {c.name}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tightest md:text-5xl">
              Hourly car rental in {polygon.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-300">
              Book a chauffeured car by the hour, half-day, full-day, or multi-day
              in {polygon.name}. Compare every partner's offer side by side, pay
              one transparent price.
            </p>
            <Link href={quickHref} className="btn-primary mt-6">
              See available cars
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-3xl font-extrabold tracking-tighter">What's included</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <Feature
              icon={<Clock className="h-5 w-5" />}
              title="Flexible duration"
              body="From 1 hour to 14 days in a single booking. KM allowance scales with duration."
            />
            <Feature
              icon={<Car className="h-5 w-5" />}
              title="Choice of class"
              body="Standard, Premium, SUV, and Van — same Sinai Taxi vetted partner network."
            />
            <Feature
              icon={<MapPin className="h-5 w-5" />}
              title="Real partner offers"
              body="Every active partner rule for this area is surfaced as an offer card, sorted by price."
            />
          </div>
        </section>

        <section className="bg-ink-50/60 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-extrabold tracking-tighter">Other destinations in {c.name}</h2>
            <p className="mt-2 text-ink-600">More service areas Sinai Taxi covers in {c.name}.</p>
            <SiblingPolygons countryCode={c.code} excludePolygonId={polygon.id} />
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">
      {icon}
    </div>
    <h3 className="mt-4 text-lg font-bold">{title}</h3>
    <p className="mt-1 text-sm leading-relaxed text-ink-600">{body}</p>
  </div>
);

const SiblingPolygons: React.FC<{ countryCode: string; excludePolygonId: string }> = async ({ countryCode, excludePolygonId }) => {
  let polygons: { id: string; name: string; slug: string | null }[] = [];
  try {
    const r = await api.polygons(countryCode);
    polygons = r.polygons.filter(p => p.id !== excludePolygonId);
  } catch {
    /* PHP outage — fall through and render nothing */
  }
  if (!polygons.length) return null;
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {polygons.slice(0, 12).map(p => (
        <li key={p.id}>
          {p.slug ? (
            <Link
              href={`/destinations/${countryCode.toLowerCase()}/${p.slug}`}
              className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm font-semibold text-ink-800 hover:border-brand-500 hover:text-brand-700 hover:shadow-soft">
              {p.name}
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <div className="rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-500">
              {p.name}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
