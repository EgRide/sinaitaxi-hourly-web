// Per-country city index. Lists every polygon Sinai Taxi covers in
// the country with the polygon name and a deep link to the per-city
// landing page.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { api } from '@/lib/api';

type Params = Promise<{ country: string }>;

// Same hero map as /destinations.
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

async function loadCountry(code: string) {
  try {
    const r = await api.polygons(code.toUpperCase());
    return r;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country } = await params;
  const data = await loadCountry(country);
  if (!data) return { title: 'Country not found' };
  return {
    title: `Hourly chauffeur in ${data.country.name}`,
    description: `Every Sinai Taxi service area in ${data.country.name}. Pick a city to see live partner offers.`,
    alternates: { canonical: `https://hourly.sinaitaxi.com/destinations/${country.toLowerCase()}` },
  };
}

export default async function CountryIndex({ params }: { params: Params }) {
  const { country } = await params;
  const data = await loadCountry(country);
  if (!data) notFound();

  const unsplash = COUNTRY_HERO[country.toLowerCase()] ?? DEFAULT_HERO;
  const polygons = data.polygons;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-brand-900 text-white">
          <div className="absolute inset-0 -z-10">
            <Image
              src={`https://images.unsplash.com/${unsplash}?auto=format&fit=crop&w=2400&q=80`}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-40"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900/80 via-brand-900/65 to-brand-900" />
          </div>
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-40">
            <Link href="/destinations" className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300 hover:text-white">
              ← All destinations
            </Link>
            <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
              Hourly chauffeur<br />
              in <span className="bg-gradient-to-r from-brand-200 via-white to-brand-300 bg-clip-text text-transparent">{data.country.name}.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
              {polygons.length} service area{polygons.length === 1 ? '' : 's'} covered.
              Pick a city to compare live partner offers side-by-side.
            </p>
          </div>
        </section>

        {/* Polygon grid */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          {polygons.length === 0 ? (
            <p className="text-base text-ink-600">No service areas to show right now.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {polygons.map(p => (
                <li key={p.id}>
                  {p.slug ? (
                    <Link
                      href={`/destinations/${country.toLowerCase()}/${p.slug}`}
                      className="group flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-5 py-4 text-base font-semibold text-ink-800 shadow-soft transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-ink-400 transition group-hover:text-brand-500" />
                        {p.name}
                      </span>
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
          )}
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
