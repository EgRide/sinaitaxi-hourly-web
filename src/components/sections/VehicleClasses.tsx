// Vehicle-class showcase. Server-renders the FEATURED subset of
// the live Sinai Taxi /ride-types catalogue (synced into our DB
// daily; see backend src/vehicleClassSync.ts). Editorial cards in
// a 2-up grid pair the curated photograph with a tight spec block.
//
// "All classes" link drops the visitor on /destinations so they
// can browse a city and see every available class for it.

import Image from 'next/image';
import Link from 'next/link';
import { Users, Briefcase, ArrowRight, Baby } from 'lucide-react';
import { api, type VehicleClass } from '@/lib/api';
import { classTier, ClassBadge, tierBorderClass } from '@/components/ClassBadge';

export const VehicleClasses: React.FC = async () => {
  let classes: VehicleClass[] = [];
  try {
    const r = await api.vehicleClasses({ featuredOnly: true });
    classes = r.classes;
  } catch {
    /* PHP outage — render nothing rather than break the page */
  }

  if (classes.length === 0) return null;

  return (
    <section className="bg-ink-50/60 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
              The vehicles
            </span>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
              Pick the class. <span className="text-ink-400">Not the car.</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              You choose the class. Your partner picks the specific vehicle —
              always inspected, always insured, always clean.
            </p>
          </div>
          <Link
            href="/destinations"
            className="hidden items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-brand-600 hover:text-brand-700 md:inline-flex">
            All 40+ classes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {classes.map(c => <ClassCard key={c.id} cls={c} />)}
        </div>

        <p className="mt-8 text-center text-xs text-ink-500 md:hidden">
          Prices vary by city and partner — actual price shown live in search.
        </p>
      </div>
    </section>
  );
};

const ClassCard: React.FC<{ cls: VehicleClass }> = ({ cls }) => {
  const tier = classTier(cls.name, cls.vehicleTypeName);
  return (
  <article className={`group overflow-hidden rounded-3xl border ${tierBorderClass(tier)} bg-white shadow-soft transition hover:shadow-glow`}>
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-ink-50 to-white">
      {cls.photoUrl ? (
        <Image
          src={cls.photoUrl}
          alt={`${cls.name} — illustrative photograph`}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain p-8 transition duration-700 group-hover:scale-[1.04]"
          unoptimized
        />
      ) : null}
      <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-800 shadow-sm backdrop-blur">
        {cls.vehicleTypeName}
      </span>
    </div>
    <div className="p-7">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-2xl font-extrabold tracking-tighter">{cls.name}</h3>
        {tier ? <ClassBadge tier={tier} /> : null}
      </div>
      {cls.description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600 line-clamp-2">{cls.description}</p>
      ) : null}
      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-ink-100 pt-5 text-xs">
        <div className="space-y-1">
          <dt className="font-bold uppercase tracking-[0.12em] text-ink-400">Capacity</dt>
          <dd className="inline-flex items-center gap-1 text-sm font-semibold text-ink-800">
            <Users className="h-3.5 w-3.5 text-ink-500" />
            {cls.seats > 0 ? `Up to ${cls.seats}` : '—'}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-bold uppercase tracking-[0.12em] text-ink-400">Luggage</dt>
          <dd className="inline-flex items-center gap-1 text-sm font-semibold text-ink-800">
            <Briefcase className="h-3.5 w-3.5 text-ink-500" />
            {cls.baggage > 0 ? `Up to ${cls.baggage}` : '—'}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-bold uppercase tracking-[0.12em] text-ink-400">Child seat</dt>
          <dd className="inline-flex items-center gap-1 text-sm font-semibold text-ink-800">
            <Baby className="h-3.5 w-3.5 text-ink-500" />
            {cls.childSeatLimit > 0 ? `${cls.childSeatLimit} max` : 'On request'}
          </dd>
        </div>
      </dl>
    </div>
  </article>
  );
};
