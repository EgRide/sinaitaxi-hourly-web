import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin, Search, Car, Receipt } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Faq } from '@/components/sections/Faq';
import { Reveal } from '@/components/Reveal';

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
    unsplash: 'photo-1494522855154-9297ac14b55f',
  },
  {
    n: '02',
    icon: Search,
    title: 'Pick the time, pick the length',
    body:
      'From one hour up to fourteen consecutive days. Multi-day bookings let you set different hours for each day — a few hours every morning, a longer outing on day three, anything you need.',
    detail:
      'KM allowance scales with the time you book. No surprise distance caps.',
    unsplash: 'photo-1454165804606-c3d57bc86b40',
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
    unsplash: 'photo-1556742049-0cfed4f6a45d',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#070912] text-white">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#070912] text-white">
          <div aria-hidden className="absolute inset-0 -z-10">
            <div className="absolute -left-32 top-[-12%] h-[40rem] w-[40rem] rounded-full bg-brand-500/25 blur-[130px]" />
            <div className="absolute right-[-14%] top-[4%] h-[38rem] w-[38rem] rounded-full bg-violet-600/25 blur-[130px]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-40">
            <Reveal>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">How it works</span>
              <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
                <span className="text-gradient">Four steps.</span><br />
                <span className="text-white/55">No fine print.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
                We built the marketplace around what we wanted ourselves: fast, transparent,
                and short on theatre. Here&rsquo;s the entire journey, top to bottom.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Steps — alternating editorial layout */}
        <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <ol className="space-y-24">
            {STEPS.map((s, idx) => (
              <li key={s.n} className={`grid items-center gap-10 ${idx % 2 ? 'lg:grid-cols-[1.2fr_1fr]' : 'lg:grid-cols-[1fr_1.2fr]'}`}>
                <Reveal className={idx % 2 ? 'lg:order-2' : ''}>
                  <div className="aspect-[5/4] min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://images.unsplash.com/${s.unsplash}?w=1400&q=70`}
                      alt={s.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Reveal>
                <Reveal delay={120} className={idx % 2 ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-3 text-brand-300">
                    <span className="text-gradient font-mono text-3xl font-extrabold tracking-tighter">{s.n}</span>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white">{s.title}</h2>
                  <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">{s.body}</p>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-white/45">{s.detail}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <Faq />

        <section className="mx-auto max-w-6xl px-6 py-24 text-center lg:py-32">
          <Reveal>
            <h2 className="text-4xl font-extrabold tracking-tightest text-white sm:text-5xl">
              Ready to <span className="text-gradient">try it?</span>
            </h2>
            <p className="mt-3 text-lg text-white/65">
              Start a search from the home page — takes under a minute.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90">
              Start your search
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
