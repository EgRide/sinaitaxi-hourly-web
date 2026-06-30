// Honest credibility, not fabricated testimonials. We're pre-launch —
// inventing customer quotes/ratings would be dishonest — so this section
// explains what "vetted" actually means and what the marketplace
// guarantees. Swap in real, consented testimonials once we have them.

import { ShieldCheck, Scale, Headset } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    <div className="max-w-2xl">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Why trust us</span>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
        “Vetted” isn’t a <span className="text-ink-400">marketing word</span> here.
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        Before a partner can publish a single price, they clear a bar. Here’s what that means for your trip.
      </p>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {PILLARS.map(({ icon: Icon, title, body }) => (
        <div key={title} className="flex flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-soft">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="mt-5 text-lg font-bold text-ink-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
        </div>
      ))}
    </div>
  </section>
);
