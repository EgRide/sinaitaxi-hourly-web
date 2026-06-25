// Featured destinations strip. Editorial city cards with full-
// bleed photography, layered headings, and subtle hover lift.
// Cities link into the SEO landing pages — these are also the
// strongest organic-traffic surfaces, so the design is built to
// stand on its own.

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface City {
  country: string;        // ISO-2 lowercase
  slug: string;
  name: string;
  countryName: string;
  tagline: string;
  unsplash: string;
}

// Curated subset — Sharm + the most marketable launch destinations.
// /destinations/[country]/[city] resolves any polygon slug PHP
// returns; this list is editorial selection, not exhaustive.
const CITIES: City[] = [
  {
    country: 'eg',
    slug: 'sharm-el-sheikh-city-centre',
    name: 'Sharm El Sheikh',
    countryName: 'Egypt',
    tagline: 'Coastal days, desert evenings.',
    unsplash: 'photo-1581281657260-87cca3a0bff7',
  },
  {
    country: 'ae',
    slug: 'dubai',
    name: 'Dubai',
    countryName: 'United Arab Emirates',
    tagline: 'Glass towers, gold-hour highways.',
    unsplash: 'photo-1512453979798-5ea266f8880c',
  },
  {
    country: 'eg',
    slug: 'hurghada',
    name: 'Hurghada',
    countryName: 'Egypt',
    tagline: 'Red Sea pickups, inland excursions.',
    unsplash: 'photo-1546412414-e1885259563a',
  },
  {
    country: 'gb',
    slug: 'london',
    name: 'London',
    countryName: 'United Kingdom',
    tagline: 'Black-cab cool, on your schedule.',
    unsplash: 'photo-1486299267070-83823f5448dd',
  },
  {
    country: 'tr',
    slug: 'istanbul',
    name: 'Istanbul',
    countryName: 'Türkiye',
    tagline: 'Two continents, one day.',
    unsplash: 'photo-1541432901042-2d8bd64b4a9b',
  },
  {
    country: 'sa',
    slug: 'riyadh',
    name: 'Riyadh',
    countryName: 'Saudi Arabia',
    tagline: 'Business hours, business class.',
    unsplash: 'photo-1578895101408-1a36b834405b',
  },
];

export const FeaturedDestinations: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
      <div className="max-w-2xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Destinations</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
          Cities you'll travel <span className="text-ink-400">through.</span>
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">
          A handful of the marketplaces we cover today. Type any address in the search above —
          we'll resolve it to a service area instantly.
        </p>
      </div>
      <Link
        href="/destinations"
        className="hidden items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-brand-600 hover:text-brand-700 md:inline-flex">
        Browse all
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CITIES.map((c) => (
        <li key={`${c.country}-${c.slug}`}>
          <Link
            href={`/destinations/${c.country}/${c.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-ink-900 shadow-soft">
            <Image
              src={`https://images.unsplash.com/${c.unsplash}?w=1000&q=70&auto=format`}
              alt={`${c.name}, ${c.countryName}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover opacity-70 transition duration-700 group-hover:scale-[1.06] group-hover:opacity-90"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{c.countryName}</span>
              <h3 className="mt-2 text-3xl font-extrabold tracking-tightest">{c.name}</h3>
              <p className="mt-1 text-sm text-white/80">{c.tagline}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-200 transition group-hover:text-white">
                See offers
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  </section>
);
