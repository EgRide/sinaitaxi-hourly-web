import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Search, Car, Receipt } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Faq } from '@/components/sections/Faq';

export const metadata: Metadata = {
  title: 'How it works — Hourly chauffeur in under a minute',
  description:
    'Type an address, pick a date, choose how long. Compare real partner offers, book in moments, ride.',
};

const STEPS = [
  {
    n: '01',
    icon: MapPin,
    title: 'Tell us where you are',
    body:
      'Type a hotel, an address, a landmark. We resolve the location to a service area instantly using Google Places — no fiddly country and city pickers, no list-scrolling.',
    detail:
      'If you\'re in a city we don\'t cover yet, you\'ll see that on the spot. Honesty up-front.',
    unsplash: 'photo-1469854523086-cc02fe5d8800',
  },
  {
    n: '02',
    icon: Search,
    title: 'Pick the time, pick the length',
    body:
      'From one hour up to fourteen consecutive days. Multi-day bookings let you set different hours for each day — a few hours every morning, a longer outing on day three, anything you need.',
    detail:
      'KM allowance scales with the time you book. No surprise distance caps.',
    unsplash: 'photo-1517524008697-84bbe3c3fd98',
  },
  {
    n: '03',
    icon: Car,
    title: 'Compare real offers',
    body:
      'Every partner covering your area surfaces side by side. Same class? You see all of them, sorted by price. Pick the one you like — there\'s no bidding and no waiting.',
    detail:
      'Total at search equals total at checkout. We add country commission to the partner\'s wholesale, and that\'s it.',
    unsplash: 'photo-1503376780353-7e6692767b70',
  },
  {
    n: '04',
    icon: Receipt,
    title: 'Pay, ride, repeat',
    body:
      'Stripe checkout, full amount up-front. Your driver is locked instantly. Driver name + phone + vehicle land in your inbox before pickup. Trip starts when they meet you.',
    detail:
      'Any KM beyond your included allowance is charged automatically after the trip via the card on file. No paperwork, no surprises.',
    unsplash: 'photo-1486299267070-83823f5448dd',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-40">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">How it works</span>
            <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
              Four steps.<br />
              <span className="text-white/60">No fine print.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
              We built the marketplace around what we wanted ourselves: fast, transparent,
              and short on theatre. Here&rsquo;s the entire journey, top to bottom.
            </p>
          </div>
        </section>

        {/* Steps — alternating editorial layout */}
        <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <ol className="space-y-24">
            {STEPS.map((s, idx) => (
              <li key={s.n} className={`grid items-center gap-10 ${idx % 2 ? 'lg:grid-cols-[1.2fr_1fr]' : 'lg:grid-cols-[1fr_1.2fr]'}`}>
                <div className={idx % 2 ? 'lg:order-2' : ''}>
                  <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-metal-100 shadow-soft">
                    <Image
                      src={`https://images.unsplash.com/${s.unsplash}?w=1400&q=70&auto=format`}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
                <div className={idx % 2 ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-3 text-brand-600">
                    <span className="font-mono text-3xl font-extrabold tracking-tighter">{s.n}</span>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-4xl font-extrabold tracking-tightest">{s.title}</h2>
                  <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-700">{s.body}</p>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Faq />

        <section className="mx-auto max-w-6xl px-6 py-24 text-center lg:py-32">
          <h2 className="text-4xl font-extrabold tracking-tightest sm:text-5xl">
            Ready to try it?
          </h2>
          <p className="mt-3 text-lg text-ink-600">
            Start a search from the home page — takes under a minute.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700">
            Start your search
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
