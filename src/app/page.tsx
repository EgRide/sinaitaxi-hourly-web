import Image from 'next/image';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { HourlySearchForm } from '@/components/sections/HourlySearchForm';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <ClassPreview />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

const Hero: React.FC = () => (
  <section className="relative overflow-hidden bg-brand-900 text-white">
    <div className="absolute inset-0 bg-road-fade bg-road-md opacity-30" aria-hidden />
    <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
      <div className="flex flex-col justify-center">
        <span className="chip mb-4 self-start bg-white/10 text-white">Hourly Rentals</span>
        <h1 className="text-4xl font-extrabold tracking-tightest md:text-6xl">
          A driver and a car. <span className="text-brand-300">By the hour.</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-300">
          One Sinai Taxi account. Hundreds of vetted partners. Book 1 hour, half a day,
          a full day, or weeks in a row — see every available offer side-by-side and pay
          one transparent price.
        </p>
      </div>
      <div className="flex items-center">
        <HourlySearchForm />
      </div>
    </div>
  </section>
);

const HowItWorks: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-20">
    <h2 className="text-3xl font-extrabold tracking-tighter">How Sinai Taxi Hourly works</h2>
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {STEPS.map(s => (
        <div key={s.title} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 font-extrabold">
            {s.n}
          </div>
          <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">{s.body}</p>
        </div>
      ))}
    </div>
  </section>
);

const STEPS = [
  {
    n: 1,
    title: 'Tell us where + how long',
    body: 'Type a pickup address, pick a date, choose hours or days. We resolve your pickup to a service area and look up every active partner there.',
  },
  {
    n: 2,
    title: 'Compare real offers',
    body: 'See every available class (Standard, Premium, SUV, Van) from every partner, sorted by price. Pick the offer that fits.',
  },
  {
    n: 3,
    title: 'Book + ride',
    body: 'Pay in full with Stripe. Driver is confirmed instantly — no accept/decline lag. Cancellation rules match Sinai Taxi’s existing policy.',
  },
];

const ClassPreview: React.FC = () => (
  <section className="bg-ink-50/60 py-20">
    <div className="mx-auto max-w-6xl px-6">
      <h2 className="text-3xl font-extrabold tracking-tighter">Pick a class that fits the trip</h2>
      <p className="mt-2 max-w-2xl text-ink-600">
        Final prices and availability depend on your pickup area and chosen
        duration. The list below is illustrative.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CLASSES.map(c => (
          <div key={c.label} className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-metal-100">
              {/* Placeholder car block — Phase 0 ships without real photos.
                  Phase 1 swaps these for real partner-supplied stills. */}
              <Image
                src={`https://images.unsplash.com/${c.unsplash}?w=600&q=60&auto=format`}
                alt={`${c.label} class`}
                width={600}
                height={336}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <h3 className="mt-4 text-lg font-bold">{c.label}</h3>
            <p className="mt-1 text-xs text-ink-500">{c.note}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CLASSES = [
  { label: 'Standard', note: '4 seats · sedan or hatchback', unsplash: 'photo-1494976388531-d1058494cdd8' },
  { label: 'Premium',  note: '4 seats · executive sedan',    unsplash: 'photo-1503376780353-7e6692767b70' },
  { label: 'SUV',      note: '4-5 seats · raised ride',      unsplash: 'photo-1605559424843-9e4c228bf1c2' },
  { label: 'Van',      note: '6-7 seats · families or kit',  unsplash: 'photo-1571127236794-81c0bbfe1ce3' },
];
