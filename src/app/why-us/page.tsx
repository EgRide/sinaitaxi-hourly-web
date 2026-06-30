import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Receipt, Bolt, Headphones } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { WhyHourly } from '@/components/sections/WhyHourly';
import { Vetting } from '@/components/sections/Vetting';

export const metadata: Metadata = {
  title: 'Why Sinai Taxi Hourly — Chauffeur marketplace, transparently priced',
  description:
    'Hourly chauffeur with a vetted partner network, transparent pricing, instant confirmation. Why travellers pick us over ride-share and rental cars.',
};

const PILLARS = [
  {
    icon: Shield,
    title: 'A network you can trust',
    body:
      'Every partner is approved by Sinai Taxi before they appear on the marketplace — operating licence, insurance, fleet condition. You see the fleet name on every offer; we share what the customer would actually want to know.',
  },
  {
    icon: Receipt,
    title: 'One price. No surprises.',
    body:
      'The number you see at search is the number on your card. Country commission is baked in. The KM allowance is generous. Any overage is automatic and itemised — never silently bundled.',
  },
  {
    icon: Bolt,
    title: 'Instant confirmation',
    body:
      'No accept-or-decline lag between you and the partner. Pick an offer, pay, and the booking is locked. Your driver\'s contact details land in your inbox before pickup.',
  },
  {
    icon: Headphones,
    title: 'Real humans in support',
    body:
      'WhatsApp + email, business hours. We answer everything from "can my driver wait at the airport" to "the partner just told me they\'re running late". One number for the whole trip.',
  },
];

export default function WhyUsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-brand-900 text-white">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=2400&q=80"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900/85 via-brand-900/70 to-brand-900" />
          </div>
          <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 sm:pt-36 sm:pb-32 lg:pt-44">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Why us</span>
            <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
              Quietly the best way<br />
              <span className="text-white/60">to hire a chauffeur.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
              We don&rsquo;t shout about being premium. The marketplace works because the details work —
              transparent prices, vetted partners, support that answers.
            </p>
          </div>
        </section>

        {/* Four-pillar value props */}
        <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Pillars</span>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
              Four things we never compromise on.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {PILLARS.map(p => (
              <article key={p.title} className="rounded-3xl border border-ink-100 bg-white p-8 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-2xl font-extrabold tracking-tighter">{p.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink-600">{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <WhyHourly />

        {/* Brand story */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-600">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Built by Sinai Taxi
          </span>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tightest sm:text-5xl">
            We started in Sinai. We&rsquo;re still here.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-700">
            Sinai Taxi began with airport pickups in South Sinai &mdash; tourists landing at Sharm,
            looking for a fair price and a driver who knew the road. The same problem kept showing up:
            <strong className="text-ink-900"> who do you trust when you&rsquo;ve just arrived somewhere new?</strong>
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-700">
            Hourly is the natural next step. Instead of one trip with one driver,
            you get a whole day with a vetted partner. Same idea, longer leash.
          </p>
        </section>

        <Vetting />

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24 lg:pb-32">
          <div className="rounded-[28px] border border-ink-100 bg-brand-900 px-8 py-16 text-center text-white sm:px-14 lg:py-20">
            <h2 className="text-4xl font-extrabold tracking-tightest sm:text-5xl">
              Try the marketplace.
            </h2>
            <p className="mt-3 text-lg text-ink-300">
              Start a search from the home page. We&rsquo;ll show you offers, prices, and partners side by side.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand-900 transition hover:bg-brand-100">
              Start your search
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
