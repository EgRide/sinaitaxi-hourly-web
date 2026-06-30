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
import { Reveal } from '@/components/Reveal';

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
    <section className="relative isolate overflow-hidden bg-[#0B0E1A] py-24 lg:py-32">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-[34rem] w-[34rem] rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[-8%] h-[30rem] w-[30rem] rounded-full bg-brand-500/15 blur-[130px]" />
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
                The vehicles
              </span>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
                Pick the class. <span className="text-gradient">Not the car.</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/65">
                You choose the class. Your partner picks the specific vehicle —
                always inspected, always insured, always clean.
              </p>
            </div>
            <Link
              href="/destinations"
              className="hidden items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-brand-300 transition hover:text-white md:inline-flex">
              All 40+ classes
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {classes.map((c, i) => (
            <Reveal key={c.id} delay={80 + (i % 2) * 80}>
              <ClassCard cls={c} />
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/45 md:hidden">
          Prices vary by city and partner — actual price shown live in search.
        </p>
      </div>
    </section>
  );
};

const ClassCard: React.FC<{ cls: VehicleClass }> = ({ cls }) => {
  const tier = classTier(cls.name, cls.vehicleTypeName);
  return (
  <article className={`group flex h-full flex-col overflow-hidden rounded-3xl border ${tierBorderClass(tier)} bg-white/[0.05] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]`}>
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-white to-ink-100">
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
      <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#070912]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/90 shadow-sm backdrop-blur">
        {cls.vehicleTypeName}
      </span>
    </div>
    <div className="p-7">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-2xl font-extrabold tracking-tighter text-white">{cls.name}</h3>
        {tier ? <ClassBadge tier={tier} /> : null}
      </div>
      {cls.description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/65 line-clamp-2">{cls.description}</p>
      ) : null}
      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-xs">
        <div className="space-y-1">
          <dt className="font-bold uppercase tracking-[0.12em] text-white/45">Capacity</dt>
          <dd className="inline-flex items-center gap-1 text-sm font-semibold text-white">
            <Users className="h-3.5 w-3.5 text-brand-300" />
            {cls.seats > 0 ? `Up to ${cls.seats}` : '—'}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-bold uppercase tracking-[0.12em] text-white/45">Luggage</dt>
          <dd className="inline-flex items-center gap-1 text-sm font-semibold text-white">
            <Briefcase className="h-3.5 w-3.5 text-brand-300" />
            {cls.baggage > 0 ? `Up to ${cls.baggage}` : '—'}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-bold uppercase tracking-[0.12em] text-white/45">Child seat</dt>
          <dd className="inline-flex items-center gap-1 text-sm font-semibold text-white">
            <Baby className="h-3.5 w-3.5 text-brand-300" />
            {cls.childSeatLimit > 0 ? `${cls.childSeatLimit} max` : 'On request'}
          </dd>
        </div>
      </dl>
    </div>
  </article>
  );
};
