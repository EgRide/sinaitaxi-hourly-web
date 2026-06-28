// Support landing page — first-line help with email + WhatsApp,
// SLA, and direct links into the booking flow for the questions
// we get asked most.

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, MessageCircle, Clock, ShieldCheck, Receipt, MapPin } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Faq } from '@/components/sections/Faq';

export const metadata: Metadata = {
  title: 'Support · Sinai Taxi Hourly',
  description: 'Talk to a human at Sinai Taxi by email or WhatsApp, day or night, anywhere.',
  alternates: { canonical: 'https://hourly.sinaitaxi.com/support' },
};

const CHANNELS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    body: 'Fastest path for trips happening today. Floating button at the bottom-right of every page.',
    href: 'https://wa.me/447423800002',
    cta: 'Open WhatsApp chat',
  },
  {
    icon: Mail,
    label: 'Email',
    body: 'Better for receipts, refunds, multi-day trips, or anything we need a paper trail for.',
    href: 'mailto:sales@sinaitaxi.com',
    cta: 'sales@sinaitaxi.com',
  },
];

const TOPICS = [
  {
    icon: Receipt,
    title: 'Refund or cancellation',
    body: 'When and how cancellations and no-shows are handled, with concrete examples.',
    href: '/refunds',
  },
  {
    icon: MapPin,
    title: 'A city not yet covered',
    body: 'Send the city + a sample request and we will pass it to the local growth team.',
    href: 'mailto:sales@sinaitaxi.com?subject=City%20request',
  },
  {
    icon: ShieldCheck,
    title: 'Driver, vehicle, or safety',
    body: 'Tell us what happened on the trip. We escalate to the partner within minutes.',
    href: 'mailto:sales@sinaitaxi.com?subject=Trip%20issue',
  },
  {
    icon: Clock,
    title: 'In-trip emergency',
    body: 'Use WhatsApp first. We will reach the partner on dispatch line and call you back.',
    href: 'https://wa.me/447423800002',
  },
];

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-36">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Support</span>
            <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
              Talk to a human.<br />
              <span className="text-white/60">Day or night.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
              Our team is reachable on WhatsApp and email from anywhere in the
              world. We aim to acknowledge every message within one hour and
              resolve most issues the same day.
            </p>
          </div>
        </section>

        {/* Channels */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Reach us</span>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
              Two ways in.
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-600">
              Pick the channel that fits the urgency.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {CHANNELS.map(c => (
              <a key={c.label} href={c.href} className="group rounded-3xl border border-ink-100 bg-white p-7 shadow-soft transition hover:border-brand-300 hover:shadow-glow">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-extrabold tracking-tighter">{c.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{c.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition group-hover:text-brand-800">
                  {c.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Common topics */}
        <section className="bg-ink-50/60 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Common topics</span>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
                Skip the chat.
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-ink-600">
                Most questions answered without writing a single message.
              </p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {TOPICS.map(t => (
                <li key={t.title}>
                  <Link href={t.href} className="group flex gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition hover:border-brand-300 hover:shadow-glow">
                    <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                      <t.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tighter">{t.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-600">{t.body}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Faq />

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-12 text-sm text-ink-500">
          <p>
            <strong className="text-ink-800">Sinai Taxi Ltd</strong> — company number
            14825809, registered in England &amp; Wales. 71-75 Shelton Street, Covent
            Garden, London WC2H 9JQ, United Kingdom.
          </p>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
