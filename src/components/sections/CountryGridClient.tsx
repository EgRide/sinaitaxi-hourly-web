'use client';

// Client-side filter shell. Region chips toggle the visible subset
// instantly; the country list itself was server-rendered, so this
// is purely UI state.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, AlertCircle } from 'lucide-react';
import { Flag } from '@/components/Flag';
import type { Country } from '@/lib/api';
import { cn } from '@/lib/cn';

// ISO-2 grouping by region. Default region is picked at render time
// as whichever has the most operating countries — keeps the strip
// from opening on an empty tab.
const REGIONS: { id: string; label: string; codes: string[] }[] = [
  { id: 'europe',   label: 'Europe',
    codes: ['AL','AT','BA','BE','BG','BY','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GB','GR','HR','HU','IE','IS','IT','LT','LU','LV','MD','ME','MK','MT','NL','NO','PL','PT','RO','RS','RU','SE','SI','SK','UA','VA','XK'] },
  { id: 'asia',     label: 'Asia',
    codes: ['AF','AM','AZ','BD','BH','BN','BT','CN','GE','HK','ID','IL','IN','IQ','IR','JO','JP','KG','KH','KP','KR','KW','KZ','LA','LB','LK','MM','MN','MO','MV','MY','NP','OM','PH','PK','PS','QA','SA','SG','SY','TH','TJ','TL','TM','TR','TW','UZ','VN','YE'] },
  { id: 'americas', label: 'Americas',
    codes: ['AR','BB','BO','BR','BS','BZ','CA','CL','CO','CR','CU','DM','DO','EC','GD','GT','GY','HN','HT','JM','KN','KY','LC','MX','NI','PA','PE','PR','PY','SR','SV','TT','US','UY','VC','VE'] },
  { id: 'africa',   label: 'Africa',
    codes: ['AO','BF','BI','BJ','BW','CD','CF','CG','CI','CM','CV','DJ','DZ','EG','ER','ET','GA','GH','GM','GN','GQ','GW','KE','KM','LR','LS','LY','MA','MG','ML','MR','MU','MW','MZ','NA','NE','NG','RW','SC','SD','SL','SN','SO','SS','SZ','TD','TG','TN','TZ','UG','ZA','ZM','ZW'] },
  { id: 'oceania',  label: 'Oceania',
    codes: ['AU','CK','FJ','FM','KI','MH','NC','NR','NU','NZ','PF','PG','PW','SB','TO','TV','VU','WS'] },
];

interface Props {
  countries: Country[];
  error: string | null;
}

export const CountryGridClient: React.FC<Props> = ({ countries, error }) => {
  // Sort: highest polygon count first, then alphabetical. Brings
  // mature markets (EG, AE, etc.) to the top of every filter.
  const sortedAll = useMemo(() => {
    return [...countries].sort((a, b) => {
      const ac = a.polygonCount ?? 0;
      const bc = b.polygonCount ?? 0;
      if (bc !== ac) return bc - ac;
      return a.name.localeCompare(b.name);
    });
  }, [countries]);

  // Open on whichever region has the most live operating countries
  // — never on an empty tab.
  const defaultRegion = useMemo(() => {
    const codeSet = new Set(countries.map(c => c.code));
    let bestId = REGIONS[0]!.id;
    let bestCount = -1;
    for (const r of REGIONS) {
      const n = r.codes.reduce((acc, code) => acc + (codeSet.has(code) ? 1 : 0), 0);
      if (n > bestCount) { bestCount = n; bestId = r.id; }
    }
    return bestId;
  }, [countries]);

  const [region, setRegion] = useState<string>(defaultRegion);

  const filtered = useMemo(() => {
    const def = REGIONS.find(r => r.id === region);
    if (!def) return sortedAll;
    const set = new Set(def.codes);
    return sortedAll.filter(c => set.has(c.code));
  }, [region, sortedAll]);

  return (
    <section id="destinations" className="mx-auto max-w-6xl px-6 py-24 lg:py-28">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Destinations</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
            Pick where you're going.
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-600">
            Hourly chauffeur service in every country below. Tap a country to see every city
            we cover and live partner offers.
          </p>
        </div>
        <p className="text-sm text-ink-500 md:max-w-[200px] md:text-right">
          {filtered.length} of {countries.length} countries in {REGIONS.find(r => r.id === region)?.label}.
        </p>
      </div>

      {/* Region chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        {REGIONS.map(r => (
          <button
            key={r.id}
            onClick={() => setRegion(r.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              region === r.id
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
            )}>
            {r.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">
          <p className="inline-flex items-center gap-2 font-bold">
            <AlertCircle className="h-4 w-4" />
            Could not load destinations.
          </p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-ink-100 bg-white p-8 text-center text-sm text-ink-500">
          No countries in this region yet — try another tab.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c, i) => <CountryCard key={c.code} country={c} index={i} />)}
        </div>
      )}
    </section>
  );
};

const CountryCard: React.FC<{ country: Country; index: number }> = ({ country, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.32, delay: Math.min(index * 0.02, 0.3), ease: [0.22, 1, 0.36, 1] }}>
    <Link
      href={`/destinations/${country.code.toLowerCase()}`}
      className="group relative block overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 transition hover:border-brand-200 hover:shadow-soft">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-100/0 blur-2xl transition-colors duration-500 group-hover:bg-brand-100/80"
      />
      <div className="relative flex items-start justify-between gap-4">
        <Flag code={country.code} size="lg" />
        <ArrowUpRight className="h-5 w-5 text-ink-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>
      <h3 className="mt-4 truncate text-base font-semibold tracking-tight text-ink-900">
        {country.name}
      </h3>
      <p className="mt-1 text-xs text-ink-500">
        {country.polygonCount && country.polygonCount > 0
          ? `${country.polygonCount} ${country.polygonCount === 1 ? 'city' : 'cities'}`
          : 'Hourly available'}
      </p>
    </Link>
  </motion.div>
);
