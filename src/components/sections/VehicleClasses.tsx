// Vehicle-class showcase. Large editorial cards in a 2-up grid.
// Each card pairs a photograph with a tight spec block. Hovering
// lifts the image — the only motion on the page that says
// "automotive".

import Image from 'next/image';
import { Users, Briefcase, Gauge, Star } from 'lucide-react';

const CLASSES = [
  {
    label: 'Standard',
    tagline: 'Honest, efficient, ready.',
    description: 'A clean sedan or hatchback with a vetted local driver. The everyday option for city days and short hops.',
    seats: 'Up to 4 seats',
    bags: 'Up to 2 cases',
    perks: 'Bottled water · Phone chargers',
    fromHourly: 'from €10/hr',
    unsplash: 'photo-1494976388531-d1058494cdd8',
  },
  {
    label: 'Premium',
    tagline: 'Executive comfort.',
    description: 'A full-size sedan finished to a higher standard — leather interior, quieter ride, English-speaking driver where available.',
    seats: 'Up to 4 seats',
    bags: 'Up to 3 cases',
    perks: 'Leather interior · Wi-Fi on request',
    fromHourly: 'from €18/hr',
    unsplash: 'photo-1503376780353-7e6692767b70',
  },
  {
    label: 'SUV',
    tagline: 'Raised ride, long legs.',
    description: 'A spacious SUV for longer day trips, family travel, or rougher roads outside the city. Plenty of room for kit.',
    seats: '4-5 seats',
    bags: 'Up to 4 cases',
    perks: 'Climate zones · Tinted rear windows',
    fromHourly: 'from €22/hr',
    unsplash: 'photo-1605559424843-9e4c228bf1c2',
  },
  {
    label: 'Van',
    tagline: 'For the whole group.',
    description: 'A 6-7 seat van for families, small teams, and trips with serious luggage. Comfortable enough for a full-day itinerary.',
    seats: '6-7 seats',
    bags: 'Up to 8 cases',
    perks: 'Sliding doors · Step assists',
    fromHourly: 'from €25/hr',
    unsplash: 'photo-1571127236794-81c0bbfe1ce3',
  },
];

export const VehicleClasses: React.FC = () => (
  <section className="bg-ink-50/60 py-24 lg:py-32">
    <div className="mx-auto max-w-6xl px-6">
      <div className="flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">The vehicles</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
            Pick the class. <span className="text-ink-400">Not the car.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            You choose Standard, Premium, SUV, or Van. Your partner picks the specific vehicle —
            always inspected, always insured, always clean.
          </p>
        </div>
        <p className="hidden text-xs text-ink-500 md:block">
          Prices vary by city and partner — actual price shown live in search.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {CLASSES.map((c) => (
          <article key={c.label} className="group overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition hover:shadow-glow">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-metal-100">
              <Image
                src={`https://images.unsplash.com/${c.unsplash}?w=1200&q=70&auto=format`}
                alt={`${c.label} class — illustrative photograph`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
              <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-800 backdrop-blur">
                <Star className="h-3 w-3 text-brand-500" />
                {c.fromHourly}
              </span>
            </div>
            <div className="p-7">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-2xl font-extrabold tracking-tighter">{c.label}</h3>
                <span className="text-sm font-medium text-ink-500">{c.tagline}</span>
              </div>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">{c.description}</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-ink-100 pt-5 text-xs">
                <div className="space-y-1">
                  <dt className="font-bold uppercase tracking-[0.12em] text-ink-400">Capacity</dt>
                  <dd className="inline-flex items-center gap-1 text-sm font-semibold text-ink-800">
                    <Users className="h-3.5 w-3.5 text-ink-500" />
                    {c.seats}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="font-bold uppercase tracking-[0.12em] text-ink-400">Luggage</dt>
                  <dd className="inline-flex items-center gap-1 text-sm font-semibold text-ink-800">
                    <Briefcase className="h-3.5 w-3.5 text-ink-500" />
                    {c.bags}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="font-bold uppercase tracking-[0.12em] text-ink-400">Inside</dt>
                  <dd className="inline-flex items-center gap-1 text-sm font-semibold text-ink-800">
                    <Gauge className="h-3.5 w-3.5 text-ink-500" />
                    Comfort
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-ink-500">{c.perks}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
