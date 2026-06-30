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
import { Reveal } from '@/components/Reveal';
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
      <main className="bg-[#070912] text-white">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#070912] text-white">
          <div className="absolute inset-0 -z-10">
            <Image
              src={heroSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#070912]/80 via-[#070912]/75 to-[#070912]" />
            <div aria-hidden className="absolute right-[-12%] top-0 h-[36rem] w-[36rem] rounded-full bg-violet-600/20 blur-[130px]" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40">
            <Reveal>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
                <Link href={`/destinations/${country.toLowerCase()}`} className="hover:text-white">{c.name}</Link>
                <span aria-hidden>·</span>
                <span className="text-white/80">{polygon.name}</span>
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
                Hourly chauffeur<br />
                in <span className="text-gradient">{polygon.name}.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
                Hire a vetted partner driver in {polygon.name} by the hour, half a day, full day, or
                weeks in a row. Compare every offer side by side, pay one transparent price.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href={quickHref}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90">
                  See available cars
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-sm font-semibold text-white/70 hover:text-white">
                  How it works →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Value props */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <Reveal>
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">In {polygon.name}</span>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
                What you'll get.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/65">
                The marketplace works the same in every city — only the partners change.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Reveal delay={0}>
              <Feature
                icon={<Clock className="h-5 w-5" />}
                title="Flexible duration"
                body="From one hour up to fourteen consecutive days. Set different hours for each day in a multi-day booking."
              />
            </Reveal>
            <Reveal delay={90}>
              <Feature
                icon={<Car className="h-5 w-5" />}
                title="40+ vehicle classes"
                body="From economy sedan to executive saloon to 50-pax bus. Pick the class — the partner picks a specific car from their fleet."
              />
            </Reveal>
            <Reveal delay={180}>
              <Feature
                icon={<MapPin className="h-5 w-5" />}
                title="Live partner offers"
                body="Every active partner covering this area surfaces side by side, sorted by price."
              />
            </Reveal>
          </div>
        </section>

        {/* Tier-2 editorial sections (skipped when no
            DestinationContent is published for this polygon). */}
        {content?.intro ? (
          <section className="mx-auto max-w-6xl px-6 pb-8 pt-4 lg:pb-12">
            <Reveal>
              <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-white/70">
                {content.intro.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </Reveal>
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
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-2xl">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Other destinations</span>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
                  Also in {c.name}.
                </h2>
              </div>
              <Link href={`/destinations/${country.toLowerCase()}`} className="hidden text-sm font-bold uppercase tracking-[0.12em] text-brand-300 hover:text-brand-200 md:inline-flex">
                All of {c.name} →
              </Link>
            </div>
          </Reveal>
          <SiblingPolygons countryCode={c.code} excludePolygonId={polygon.id} />
        </section>

        <Faq />

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0E1A] px-8 py-14 text-center text-white sm:px-14 lg:py-20">
              <div aria-hidden className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-brand-500/20 blur-[110px]" />
              <div aria-hidden className="absolute -right-16 -bottom-16 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[110px]" />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                {polygon.name}
              </span>
              <h2 className="mt-5 text-4xl font-extrabold tracking-tightest sm:text-5xl">
                Get prices in {polygon.name} now.
              </h2>
              <Link href={quickHref} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90">
                Start your search
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div className="glass h-full rounded-3xl p-6 transition hover:-translate-y-1 hover:border-white/20">
    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-brand-300">{icon}</div>
    <h3 className="mt-4 text-xl font-extrabold tracking-tighter text-white">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
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
    <Reveal>
      <div className="max-w-2xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">What to do</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
          Trips that make the rental pay off.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/65">
          Local picks that work cleanly within a half-day, full-day, or multi-day rental in {polygonName}.
        </p>
      </div>
    </Reveal>
    <ul className="mt-12 grid gap-5 md:grid-cols-2">
      {items.map((a, i) => (
        <li key={a.name}>
          <Reveal delay={(i % 2) * 90} className="h-full">
            <div className="group h-full overflow-hidden glass rounded-3xl transition hover:-translate-y-1 hover:border-white/20">
              {a.photoUrl ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.photoUrl} alt={a.name} loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E1A]/60 to-transparent" />
                </div>
              ) : null}
              <div className="p-6">
                <h3 className="text-2xl font-extrabold tracking-tighter text-white">{a.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{a.blurb}</p>
                {a.durationMin ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    <Clock className="h-3.5 w-3.5" />
                    {a.durationMin >= 720
                      ? `${Math.round(a.durationMin / 60)} hr rental ↑`
                      : `${Math.round(a.durationMin / 60)} hr rental`}
                  </p>
                ) : null}
              </div>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
    <div className="mt-10 text-center">
      <Link href={quickHref} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90">
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
  <section className="bg-[#0B0E1A] py-20 lg:py-28">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Local tips</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
            What we'd tell a friend.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            Practical things to know that save time, money, or a headache when you're in {polygonName}.
          </p>
        </div>
      </Reveal>
      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {items.map((t, i) => (
          <li key={t.title}>
            <Reveal delay={(i % 2) * 90} className="h-full">
              <div className="glass h-full rounded-3xl p-6 transition hover:-translate-y-1 hover:border-white/20">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-400/20 bg-amber-500/15 text-amber-300">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold tracking-tighter text-white">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{t.body}</p>
              </div>
            </Reveal>
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
      <Reveal>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Local FAQ</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
            Questions about {polygonName}.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            The specific things travellers ask about renting an hourly chauffeur here.
          </p>
        </div>
      </Reveal>
      <ul className="space-y-3">
        {items.map((q, i) => (
          <li key={q.question}>
            <Reveal delay={Math.min(i, 6) * 60}>
              <div className="glass rounded-2xl p-6 transition hover:border-white/20">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-300">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{q.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{q.answer}</p>
                  </div>
                </div>
              </div>
            </Reveal>
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
    <section className="bg-[#0B0E1A] py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Classes available</span>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
                Pick a class. <span className="text-gradient">Live prices.</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
                Top picks from our 40+ classes — every active partner in {polygonName} surfaces side-by-side at checkout.
              </p>
            </div>
            <Link href="/destinations" className="hidden text-sm font-bold uppercase tracking-[0.12em] text-brand-300 hover:text-brand-200 md:inline-flex">
              All classes →
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {classes.slice(0, 4).map((c, i) => (
            <Reveal key={c.id} delay={(i % 4) * 80} className="h-full">
              <Link href={quickHref} className="group block h-full overflow-hidden glass rounded-3xl transition hover:-translate-y-1 hover:border-white/20">
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
                  <h3 className="text-xl font-extrabold tracking-tighter text-white">{c.name}</h3>
                  {c.description ? (
                    <p className="mt-1 text-xs text-white/45 line-clamp-1">{c.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/65">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-brand-300" /> {c.seats > 0 ? `Up to ${c.seats}` : '—'}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-brand-300" /> {c.baggage > 0 ? `${c.baggage} bags` : 'Luggage'}</span>
                    {c.childSeatLimit > 0 ? (
                      <span className="inline-flex items-center gap-1"><Baby className="h-3.5 w-3.5 text-brand-300" /> {c.childSeatLimit} max</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </Reveal>
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
      {polygons.slice(0, 12).map((p, i) => (
        <li key={p.id}>
          {p.slug ? (
            <Reveal delay={Math.min(i, 9) * 50}>
              <Link
                href={`/destinations/${countryCode.toLowerCase()}/${p.slug}`}
                className="group flex items-center justify-between glass rounded-2xl px-5 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20">
                <span>{p.name}</span>
                <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:text-brand-300 group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          ) : (
            <div className="glass rounded-2xl px-5 py-4 text-base text-white/45">
              {p.name}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
