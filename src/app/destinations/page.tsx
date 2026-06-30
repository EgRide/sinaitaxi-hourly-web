// Destinations index — editorial grid of every operating country.
// Lists the live SinaiTaxi country catalogue with hero photography
// and polygon counts so the visitor can drill into the per-city
// SEO landing pages.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Reveal } from '@/components/Reveal';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Destinations — Hourly chauffeur worldwide',
  description:
    'Hire a chauffeured car by the hour in any of the cities Sinai Taxi covers. From Cairo to Dubai to London — pick a city to see live partner offers.',
  alternates: { canonical: 'https://hourly.sinaitaxi.com/destinations' },
};

// Hero photography keyed by ISO-2 country code. Falls back to a
// generic coastal road for any country we haven't curated yet.
const COUNTRY_HERO: Record<string, string> = {
  eg: 'photo-1572252009286-268acec5ca0a',
  ae: 'photo-1512453979798-5ea266f8880c',
  sa: 'photo-1578895101408-1a36b834405b',
  gb: 'photo-1486299267070-83823f5448dd',
  tr: 'photo-1541432901042-2d8bd64b4a9b',
  fr: 'photo-1502602898657-3e91760cbb34',
  it: 'photo-1525874684015-58379d421a52',
  jo: 'photo-1568322445389-f64ac2515099',
  ma: 'photo-1539650116574-75c0c6d73c0e',
  th: 'photo-1528181304800-259b08848526',
  br: 'photo-1483729558449-99ef09a8c325',
  ar: 'photo-1589909202802-8f4aadce1849',
  al: 'photo-1593986373471-7a17afde81c9',
  dz: 'photo-1486713233444-d3fb9da8d83e',
};
const DEFAULT_HERO = 'photo-1469854523086-cc02fe5d8800';

async function loadCountries() {
  try {
    const r = await api.countries();
    return r.countries;
  } catch {
    return [];
  }
}

export default async function DestinationsIndex() {
  const countries = await loadCountries();

  return (
    <>
      <SiteHeader />
      <main className="bg-[#070912] text-white">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#070912] text-white">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2400&q=70"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#070912]/80 via-[#070912]/75 to-[#070912]" />
            <div aria-hidden className="absolute right-[-12%] top-0 h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/20 blur-[130px]" />
          </div>
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-40">
            <Reveal>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Destinations</span>
              <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
                Every market<br />
                <span className="text-gradient">we cover.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
                {countries.length} countries, hundreds of cities. Tap any country to see
                every service area we publish prices for — then pick a city to see live
                partner offers.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Countries grid */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          {countries.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <p className="text-base text-white/65">
                Live catalogue unavailable right now. Please check back in a moment.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c, i) => {
                const unsplash = COUNTRY_HERO[c.code.toLowerCase()] ?? DEFAULT_HERO;
                return (
                  <li key={c.code}>
                    <Reveal delay={Math.min(i, 8) * 60}>
                      <Link
                        href={`/destinations/${c.code.toLowerCase()}`}
                        className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-[#0B0E1A] transition hover:-translate-y-1 hover:border-white/20">
                        <Image
                          src={`https://images.unsplash.com/${unsplash}?w=1000&q=70&auto=format`}
                          alt={c.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover opacity-60 transition duration-700 group-hover:scale-[1.06] group-hover:opacity-80"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070912] via-[#070912]/40 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] backdrop-blur">
                            <MapPin className="h-3 w-3" />
                            {c.code}
                          </span>
                          <h3 className="mt-3 text-3xl font-extrabold tracking-tightest">{c.name}</h3>
                          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-200 transition group-hover:text-white">
                            Browse cities
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0E1A] px-8 py-14 text-center text-white sm:px-14 lg:py-20">
              <div aria-hidden className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-brand-500/20 blur-[110px]" />
              <div aria-hidden className="absolute -right-16 -bottom-16 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[110px]" />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                Skip the list
              </span>
              <h2 className="mt-5 text-4xl font-extrabold tracking-tightest sm:text-5xl">
                Type the address. Skip the menus.
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-base text-white/65">
                Our home page resolves any street, hotel, or landmark to the right
                service area instantly. Start there.
              </p>
              <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90">
                Search your trip
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
