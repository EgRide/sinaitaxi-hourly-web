// Featured destinations strip. Editorial city cards with full-bleed
// photography, layered headings, and subtle hover lift.
//
// Source of truth: GET /v1/destinations/featured. Rows surface when
// admin ticks "Show on homepage" in the DestinationContent editor.
// Falls back to a small curated client-side list when the API has
// no featured rows yet (so the homepage never ships an empty
// section before content is staged).

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { api, type FeaturedDestination } from '@/lib/api';

interface FallbackCity {
  country: string;
  slug: string;
  name: string;
  countryName: string;
  tagline: string;
  unsplash: string;
}

// Editorial fallback — only renders if /v1/destinations/featured
// returns nothing. As soon as the admin ticks "Show on homepage"
// for at least one row, this stops being used.
const FALLBACK: FallbackCity[] = [
  { country: 'eg', slug: 'sharm-el-sheikh', name: 'Sharm El Sheikh', countryName: 'Egypt',
    tagline: 'Coastal days, desert evenings.', unsplash: 'photo-1572252009286-268acec5ca0a' },
  { country: 'ae', slug: 'dubai', name: 'Dubai', countryName: 'United Arab Emirates',
    tagline: 'Glass towers, gold-hour highways.', unsplash: 'photo-1512453979798-5ea266f8880c' },
  { country: 'eg', slug: 'hurghada', name: 'Hurghada', countryName: 'Egypt',
    tagline: 'Red Sea pickups, inland excursions.', unsplash: 'photo-1546412414-e1885259563a' },
  { country: 'gb', slug: 'london', name: 'London', countryName: 'United Kingdom',
    tagline: 'Black-cab cool, on your schedule.', unsplash: 'photo-1486299267070-83823f5448dd' },
  { country: 'tr', slug: 'istanbul', name: 'Istanbul', countryName: 'Türkiye',
    tagline: 'Two continents, one day.', unsplash: 'photo-1541432901042-2d8bd64b4a9b' },
  { country: 'sa', slug: 'riyadh', name: 'Riyadh', countryName: 'Saudi Arabia',
    tagline: 'Business hours, business class.', unsplash: 'photo-1578895101408-1a36b834405b' },
];

const cityNameFromTitle = (title: string | null, slug: string): string => {
  // Title is typically "Hourly chauffeur in Sharm El Sheikh" — strip
  // the prefix when present so the card displays the city only.
  if (title) {
    const m = title.match(/in (.+?)(?:,|$)/i);
    if (m) return m[1].trim();
    return title;
  }
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

async function loadFeatured(): Promise<FeaturedDestination[]> {
  try {
    const r = await api.featuredDestinations(9);
    return r.destinations;
  } catch {
    return [];
  }
}

export const FeaturedDestinations: React.FC = async () => {
  const dynamicRows = await loadFeatured();
  const useFallback = dynamicRows.length === 0;

  return (
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
        {useFallback
          ? FALLBACK.map(c => (
              <DestinationCard
                key={`${c.country}-${c.slug}`}
                href={`/destinations/${c.country}/${c.slug}`}
                name={c.name}
                countryName={c.countryName}
                tagline={c.tagline}
                photoSrc={`https://images.unsplash.com/${c.unsplash}?w=1000&q=70&auto=format`}
              />
            ))
          : dynamicRows.map(d => (
              <DestinationCard
                key={d.polygonPhpId}
                href={`/destinations/${d.countryCode}/${d.citySlug}`}
                name={cityNameFromTitle(d.title, d.citySlug)}
                countryName={d.countryName}
                tagline={d.tagline ?? 'Hourly chauffeur, on demand.'}
                photoSrc={d.heroPhotoUrl ?? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000&q=70&auto=format'}
              />
            ))}
      </ul>
    </section>
  );
};

const DestinationCard: React.FC<{
  href: string;
  name: string;
  countryName: string;
  tagline: string;
  photoSrc: string;
}> = ({ href, name, countryName, tagline, photoSrc }) => (
  <li>
    <Link
      href={href}
      className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-ink-900 shadow-soft">
      <Image
        src={photoSrc}
        alt={`${name}, ${countryName}`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover opacity-70 transition duration-700 group-hover:scale-[1.06] group-hover:opacity-90"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{countryName}</span>
        <h3 className="mt-2 text-3xl font-extrabold tracking-tightest">{name}</h3>
        <p className="mt-1 text-sm text-white/80 line-clamp-2">{tagline}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-200 transition group-hover:text-white">
          See offers
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  </li>
);
