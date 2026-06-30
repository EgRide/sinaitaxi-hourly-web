// Single-row trust strip. Lives directly after the hero spacer
// so the user reads "vetted · transparent · instant" right as
// the floating search card resolves.

import { ShieldCheck, ReceiptText, BoltIcon as Bolt, Headphones } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const POINTS = [
  { icon: ShieldCheck, label: 'Vetted partners',     body: 'Every fleet is approved by Sinai Taxi before they appear on the marketplace.' },
  { icon: ReceiptText, label: 'No surprise fees',    body: 'The total at search is the total at checkout. Including the KM allowance.' },
  { icon: Bolt,        label: 'Instant confirmation', body: 'No accept-or-decline lag. Pick an offer, pay, and your driver is locked.' },
  { icon: Headphones,  label: 'Always reachable',    body: 'Live support by WhatsApp + email, before, during, and after the trip.' },
];

export const TrustStrip: React.FC = () => (
  <section className="border-y border-white/10 bg-[#070912]">
    <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
      {POINTS.map((p, i) => (
        <Reveal key={p.label} delay={i * 80}>
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-white/5 text-brand-300 ring-1 ring-white/10">
              <p.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-white">{p.label}</div>
              <p className="mt-1 text-xs leading-relaxed text-white/65">{p.body}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);
