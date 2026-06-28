// SEO landing page per (country, city). Editorial layout matching
// the homepage aesthetic — large city hero, value props,
// vehicle-class scoped imagery, sibling polygons grid, FAQ.
//
// `params.country` is ISO-2 lowercase. `params.city` is the polygon
// `slug`. Both resolved server-side from the catalogue.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, MapPin, Car, ArrowRight, Sparkles, Users, Briefcase, Baby, Lightbulb, HelpCircle } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Faq } from '@/components/sections/Faq';
import { api, type VehicleClass, type DestinationContent } from '@/lib/api';

type Params = Promise<{ country: string; city: string }>;

// Hero photography keyed by ISO-2 country code. Fall back to a
// generic coastal road if we don't have an editorial pick for a
// country yet. Real licensed photography swaps in at launch.
const COUNTRY_HERO: Record<string, string> = {
  eg: 'photo-1572252009286-268acec5ca0a',
  ae: 'photo-1512453979798-5ea266f8880c',
  sa: 'photo-1578895101408-1a36b834405b',
  gb: 'photo-1486299267070-83823f5448dd',
  tr: 'photo-1541432901042-2d8bd64b4a9b',
  fr: 'photo-1502602898657-3e91760cbb34',
  it: 'photo-1525874684015-58379d421a52',
};
const DEFAULT_HERO = 'photo-1469854523086-cc02fe5d8800';

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

async function loadContent(country: string, city: string): Promise<DestinationContent | null> {
  try {
    const r = await api.destinationContent(country.toUpperCase(), city.toLowerCase());
    return r.content;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country, city } = await params;
  const [resolved, content] = await Promise.all([
    resolveCityFromSlug(country, city),
    loadContent(country, city),
  ]);
  if (!resolved) return { title: 'Destination not found' };
  const { country: c, polygon } = resolved;
  const fallbackTitle = `Hourly chauffeur in ${polygon.name}, ${c.name}`;
  const fallbackDescription = `Hire a chauffeured car by the hour in ${polygon.name}. From half a day to multi-day rentals on the Sinai Taxi marketplace.`;
  return {
    title: content?.title ?? fallbackTitle,
    description: content?.metaDescription ?? fallbackDescription,
    alternates: { canonical: `https://hourly.sinaitaxi.com/destinations/${country.toLowerCase()}/${city.toLowerCase()}` },
  };
}

export default async function DestinationPage({ params }: { params: Params }) {
  const { country, city } = await params;
  const [resolved, content] = await Promise.all([
    resolveCityFromSlug(country, city),
    loadContent(country, city),
  ]);
  if (!resolved) notFound();
  const { country: c, polygon } = resolved;

  // Quick-start link: now + 24h, 4-hour rental.
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const pickupAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:00`;
  const quickHref = `/search?countryCode=${c.code}&polygonId=${polygon.id}&pickupAt=${encodeURIComponent(pickupAt)}&durationHours=4`;
  const heroUnsplash = COUNTRY_HERO[country.toLowerCase()] ?? DEFAULT_HERO;
  const heroSrc = content?.heroPhotoUrl
    ?? `https://images.unsplash.com/${heroUnsplash}?auto=format&fit=crop&w=2400&q=80`;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-brand-900 text-white">
          <div className="absolute inset-0 -z-10">
            <Image
              src={heroSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-40"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900/80 via-brand-900/65 to-brand-900" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
              <Link href={`/destinations/${country.toLowerCase()}`} className="hover:text-white">{c.name}</Link>
              <span aria-hidden>·</span>
              <span className="text-white/80">{polygon.name}</span>
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
              Hourly chauffeur<br />
              in <span className="bg-gradient-to-r from-brand-200 via-white to-brand-300 bg-clip-text text-transparent">{polygon.name}.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
              Hire a vetted partner driver in {polygon.name} by the hour, half a day, full day, or
              weeks in a row. Compare every offer side by side, pay one transparent price.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={quickHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand-900 transition hover:bg-brand-100">
                See available cars
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm font-semibold text-white/70 hover:text-white">
                How it works →
              </Link>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">In {polygon.name}</span>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
              What you'll get.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              The marketplace works the same in every city — only the partners change.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Feature
              icon={<Clock className="h-5 w-5" />}
              title="Flexible duration"
              body="From one hour up to fourteen consecutive days. Set different hours for each day in a multi-day booking."
            />
            <Feature
              icon={<Car className="h-5 w-5" />}
              title="40+ vehicle classes"
              body="From economy sedan to executive saloon to 50-pax bus. Pick the class — the partner picks a specific car from their fleet."
            />
            <Feature
              icon={<MapPin className="h-5 w-5" />}
              title="Live partner offers"
              body="Every active partner covering this area surfaces side by side, sorted by price."
            />
          </div>
        </section>

        {/* Tier-2 editorial sections (skipped when no
            DestinationContent is published for this polygon). */}
        {content?.intro ? (
          <section className="mx-auto max-w-6xl px-6 pb-8 pt-4 lg:pb-12">
            <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-ink-700">
              {content.intro.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        ) : null}

        {content?.attractions?.length ? (
          <AttractionsSection items={content.attractions} polygonName={polygon.name} quickHref={quickHref} />
        ) : null}

        {/* Class strip — pulls the featured slice of the live
            /v1/catalog/vehicle-classes catalogue so it stays in
            sync with the homepage and the partner rule editor. */}
        <ClassStrip quickHref={quickHref} polygonName={polygon.name} />

        {content?.tips?.length ? (
          <TipsSection items={content.tips} polygonName={polygon.name} />
        ) : null}

        {content?.faqs?.length ? (
          <LocalFaqSection items={content.faqs} polygonName={polygon.name} />
        ) : null}

        {/* Sibling polygons */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Other destinations</span>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
                Also in {c.name}.
              </h2>
            </div>
            <Link href={`/destinations/${country.toLowerCase()}`} className="hidden text-sm font-bold uppercase tracking-[0.12em] text-brand-600 hover:text-brand-700 md:inline-flex">
              All of {c.name} →
            </Link>
          </div>
          <SiblingPolygons countryCode={c.code} excludePolygonId={polygon.id} />
        </section>

        <Faq />

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-[28px] bg-brand-900 px-8 py-14 text-center text-white sm:px-14 lg:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand-200" />
              {polygon.name}
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tightest sm:text-5xl">
              Get prices in {polygon.name} now.
            </h2>
            <Link href={quickHref} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand-900 transition hover:bg-brand-100">
              Start your search
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</div>
    <h3 className="mt-4 text-xl font-extrabold tracking-tighter">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
  </div>
);

// ── Tier-2 editorial blocks ──────────────────────────────────
// Each section degrades silently when its data is empty — the
// page.tsx already gates rendering, but the components also
// guard so we never ship an empty-shell <section>.

const AttractionsSection: React.FC<{
  items: NonNullable<DestinationContent['attractions']>;
  polygonName: string;
  quickHref: string;
}> = ({ items, polygonName, quickHref }) => (
  <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
    <div className="max-w-2xl">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">What to do</span>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
        Trips that make the rental pay off.
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ink-600">
        Local picks that work cleanly within a half-day, full-day, or multi-day rental in {polygonName}.
      </p>
    </div>
    <ul className="mt-12 grid gap-5 md:grid-cols-2">
      {items.map((a) => (
        <li key={a.name} className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft">
          {a.photoUrl ? (
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.photoUrl} alt={a.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="p-6">
            <h3 className="text-2xl font-extrabold tracking-tighter">{a.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{a.blurb}</p>
            {a.durationMin ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                <Clock className="h-3.5 w-3.5" />
                {a.durationMin >= 720
                  ? `${Math.round(a.durationMin / 60)} hr rental ↑`
                  : `${Math.round(a.durationMin / 60)} hr rental`}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
    <div className="mt-10 text-center">
      <Link href={quickHref} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700">
        Plan one of these
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
);

const TipsSection: React.FC<{
  items: NonNullable<DestinationContent['tips']>;
  polygonName: string;
}> = ({ items, polygonName }) => (
  <section className="bg-ink-50/60 py-20 lg:py-28">
    <div className="mx-auto max-w-6xl px-6">
      <div className="max-w-2xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Local tips</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
          What we'd tell a friend.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-600">
          Practical things to know that save time, money, or a headache when you're in {polygonName}.
        </p>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {items.map((t) => (
          <li key={t.title} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold tracking-tighter">{t.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{t.body}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const LocalFaqSection: React.FC<{
  items: NonNullable<DestinationContent['faqs']>;
  polygonName: string;
}> = ({ items, polygonName }) => (
  <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
    <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Local FAQ</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
          Questions about {polygonName}.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-600">
          The specific things travellers ask about renting an hourly chauffeur here.
        </p>
      </div>
      <ul className="space-y-3">
        {items.map((q) => (
          <li key={q.question} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-900">{q.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{q.answer}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

// Renders the live featured slice of /v1/catalog/vehicle-classes
// (synced from PHP /ride-types). Each card deep-links into the
// search results pre-filled for the destination.
const ClassStrip: React.FC<{ quickHref: string; polygonName: string }> = async ({ quickHref, polygonName }) => {
  let classes: VehicleClass[] = [];
  try {
    const r = await api.vehicleClasses({ featuredOnly: true });
    classes = r.classes;
  } catch {
    /* PHP outage — render nothing rather than break the page */
  }
  if (!classes.length) return null;

  return (
    <section className="bg-ink-50/60 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Classes available</span>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
              Pick a class. <span className="text-ink-400">Live prices.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600">
              Top picks from our 40+ classes — every active partner in {polygonName} surfaces side-by-side at checkout.
            </p>
          </div>
          <Link href="/destinations" className="hidden text-sm font-bold uppercase tracking-[0.12em] text-brand-600 hover:text-brand-700 md:inline-flex">
            All classes →
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {classes.slice(0, 4).map(c => (
            <Link key={c.id} href={quickHref} className="group overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition hover:shadow-glow">
              <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-ink-50 to-white">
                {c.photoUrl ? (
                  <Image
                    src={c.photoUrl}
                    alt={`${c.name} — illustrative photograph`}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-contain p-6 transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : null}
                <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-ink-800 backdrop-blur">
                  {c.vehicleTypeName}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-extrabold tracking-tighter">{c.name}</h3>
                {c.description ? (
                  <p className="mt-1 text-xs text-ink-500 line-clamp-1">{c.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.seats > 0 ? `Up to ${c.seats}` : '—'}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {c.baggage > 0 ? `${c.baggage} bags` : 'Luggage'}</span>
                  {c.childSeatLimit > 0 ? (
                    <span className="inline-flex items-center gap-1"><Baby className="h-3.5 w-3.5" /> {c.childSeatLimit} max</span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const SiblingPolygons: React.FC<{ countryCode: string; excludePolygonId: string }> = async ({ countryCode, excludePolygonId }) => {
  let polygons: { id: string; name: string; slug: string | null }[] = [];
  try {
    const r = await api.polygons(countryCode);
    polygons = r.polygons.filter(p => p.id !== excludePolygonId);
  } catch {
    /* PHP outage — render nothing */
  }
  if (!polygons.length) return null;
  return (
    <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {polygons.slice(0, 12).map(p => (
        <li key={p.id}>
          {p.slug ? (
            <Link
              href={`/destinations/${countryCode.toLowerCase()}/${p.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-5 py-4 text-base font-semibold text-ink-800 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700">
              <span>{p.name}</span>
              <ArrowRight className="h-4 w-4 text-ink-400 transition group-hover:text-brand-600 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div className="rounded-2xl border border-ink-100 bg-white px-5 py-4 text-base text-ink-500">
              {p.name}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
