// Three editorial quote cards. Sparing — three is enough, more
// feels desperate. Placeholder names and cities (we'll swap for
// real customer testimonials once we have written consent).

import { Quote, Star } from 'lucide-react';

const QUOTES = [
  {
    quote: "The car was parked outside our hotel five minutes early, which never happens. We did three sites in one day without ever opening a map.",
    name:  "Leila K.",
    role:  "Family of four · Sharm El Sheikh",
    rating: 5,
  },
  {
    quote: "Booked from my phone at the airport. The driver was waiting in arrivals when we landed. The whole transaction took under a minute.",
    name:  "Marcus P.",
    role:  "Business · Dubai",
    rating: 5,
  },
  {
    quote: "I rented for three days, four hours each, varying schedules. The website handled it without making me read fine print. Simple.",
    name:  "Aisha M.",
    role:  "Family trip · Cairo",
    rating: 5,
  },
];

export const Testimonials: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <div className="max-w-2xl">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Travellers</span>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
        Words from <span className="text-ink-400">the back seat.</span>
      </h2>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {QUOTES.map((q) => (
        <figure key={q.name} className="flex flex-col justify-between rounded-3xl border border-ink-100 bg-white p-7 shadow-soft">
          <Quote className="h-7 w-7 text-brand-500" />
          <blockquote className="mt-5 text-base leading-relaxed text-ink-800">
            “{q.quote}”
          </blockquote>
          <figcaption className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
            <div>
              <div className="text-sm font-bold text-ink-900">{q.name}</div>
              <div className="text-xs text-ink-500">{q.role}</div>
            </div>
            <div className="inline-flex items-center gap-0.5 text-accent-500">
              {Array.from({ length: q.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  </section>
);
