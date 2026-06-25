// Single-row trust strip. Lives directly after the hero spacer
// so the user reads "vetted · transparent · instant" right as
// the floating search card resolves.

import { ShieldCheck, ReceiptText, BoltIcon as Bolt, Headphones } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, label: 'Vetted partners',     body: 'Every fleet is approved by Sinai Taxi before they appear on the marketplace.' },
  { icon: ReceiptText, label: 'No surprise fees',    body: 'The total at search is the total at checkout. Including the KM allowance.' },
  { icon: Bolt,        label: 'Instant confirmation', body: 'No accept-or-decline lag. Pick an offer, pay, and your driver is locked.' },
  { icon: Headphones,  label: 'Always reachable',    body: 'Live support by WhatsApp + email, before, during, and after the trip.' },
];

export const TrustStrip: React.FC = () => (
  <section className="border-y border-ink-100 bg-white">
    <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
      {POINTS.map((p) => (
        <div key={p.label} className="flex items-start gap-4">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <p.icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-bold text-ink-900">{p.label}</div>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">{p.body}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
