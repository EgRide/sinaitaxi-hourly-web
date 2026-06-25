'use client';

// Lean accordion. Single source of truth for the answers shown
// here AND on the dedicated /help page; ops can edit copy in
// one place. Keyboard accessible (native <details>/<summary>).

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const QUESTIONS = [
  {
    q: 'How is hourly different from a normal taxi or ride-share?',
    a: 'Your driver stays with you for the booked duration. They wait between stops, drive you to multiple places, and drop you back. You pay one transparent price for the whole window — no surge, no per-stop charge.',
  },
  {
    q: 'What if I go over the included kilometres?',
    a: 'Each booking includes a generous KM allowance based on duration and vehicle class. If you exceed it, the partner records the final odometer reading and a per-kilometre overage charge is processed automatically on your saved card after the trip. No paperwork, no surprises.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes — for free, up to 24 hours before pickup. Within 24 hours of pickup, bookings are non-refundable, matching the Sinai Taxi rides policy. Customer no-shows (more than 60 minutes late at pickup) are also non-refundable.',
  },
  {
    q: 'Who is my driver?',
    a: 'A vetted partner from the Sinai Taxi network. The partner is selected at the moment you pick their offer — no bidding, no waiting. Once they assign a specific driver, you receive their name, phone number, and vehicle description by email before pickup.',
  },
  {
    q: 'How long can a booking be?',
    a: 'From one hour up to fourteen consecutive days. Multi-day bookings let you set different hours for each day — a few hours every morning, a longer outing on day three, anything you need.',
  },
  {
    q: 'How does the payment work?',
    a: 'You pay the full booked amount at checkout via Stripe. Your card is securely saved to charge any KM overage automatically after the trip. We never store card details ourselves.',
  },
  {
    q: 'What countries do you operate in?',
    a: 'Sixty-plus, across the Sinai Taxi partner network. Any address you type is checked against the live operating list — if we don\'t cover an area yet, you\'ll see a clear message at search time.',
  },
];

export const Faq: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-ink-50/60 py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="max-w-md">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">FAQ</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
            Questions we hear <span className="text-ink-400">often.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink-600">
            Can't find what you're after? Email{' '}
            <a href="mailto:sales@sinaitaxi.com" className="font-semibold text-brand-600 hover:text-brand-700">
              sales@sinaitaxi.com
            </a>{' '}
            or message us on WhatsApp — we reply in business hours.
          </p>
        </div>

        <ul className="space-y-3">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-ink-50/40">
                  <span className="text-base font-bold text-ink-900 sm:text-lg">{item.q}</span>
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-base leading-relaxed text-ink-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
