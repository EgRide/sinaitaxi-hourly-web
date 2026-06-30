// Honest credibility, not fabricated testimonials. We're pre-launch —
// inventing customer quotes/ratings would be dishonest — so this section
// explains what "vetted" actually means and what the marketplace
// guarantees. Swap in real, consented testimonials once we have them.

import { ShieldCheck, Scale, Headset } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const PILLARS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Approved, not just listed',
    body: 'Operators are reviewed and approved by Sinai Taxi before they reach the marketplace. No one just signs up and starts charging your card.',
  },
  {
    icon: Scale,
    title: 'One price, locked at search',
    body: 'The total you see includes the kilometre allowance — no surge, no per-stop fee, no surprise at the door. What you book is what you pay.',
  },
  {
    icon: Headset,
    title: 'A human, before and after',
    body: 'Booking, receipts, and help live in one account, with a real person on WhatsApp and email before, during, and after the trip.',
  },
];

export const Vetting: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <Reveal>
      <div className="max-w-2xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Why trust us</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
          “Vetted” isn’t a <span className="text-gradient">marketing word</span> here.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/65">
          Before a partner can publish a single price, they clear a bar. Here’s what that means for your trip.
        </p>
      </div>
    </Reveal>

    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {PILLARS.map(({ icon: Icon, title, body }, i) => (
        <Reveal key={title} delay={80 + i * 80}>
          <div className="flex h-full flex-col rounded-3xl glass p-7 transition hover:-translate-y-1 hover:border-white/20">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-brand-300 ring-1 ring-white/10">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);
