// "Why hourly" — explicit comparison to the alternatives.
// A two-column editorial layout: a tight value-prop matrix on
// the right, a single statement on the left. Reads like a
// short essay, looks like a comparison chart.

import { Check, X } from 'lucide-react';

const ROWS = [
  { label: 'Driver waits between stops',         hourly: true,  ride: false, rental: false, agency: true  },
  { label: 'Pay only for the time you book',     hourly: true,  ride: true,  rental: false, agency: false },
  { label: 'No surge pricing',                   hourly: true,  ride: false, rental: true,  agency: true  },
  { label: 'Same partner for the whole journey', hourly: true,  ride: false, rental: false, agency: true  },
  { label: 'Drive yourself in unknown traffic',  hourly: false, ride: false, rental: true,  agency: false },
  { label: 'Booked in under a minute',           hourly: true,  ride: true,  rental: false, agency: false },
];

const COLUMNS = ['Sinai Taxi Hourly', 'Ride-share', 'Rental car', 'Traditional chauffeur'];

const Cell: React.FC<{ on: boolean }> = ({ on }) => (
  on
    ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
    : <X     className="mx-auto h-4 w-4 text-ink-300" />
);

export const WhyHourly: React.FC = () => (
  <section className="bg-brand-900 py-24 text-white lg:py-32">
    <div className="mx-auto max-w-6xl px-6">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="max-w-md">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Why hourly</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
            Better than the alternatives. <span className="text-white/50">Quietly so.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-300">
            Hourly with a chauffeur sits between ride-share and a rental car — and out-performs
            either when your day involves multiple stops, a long pickup window, or unfamiliar roads.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink-300">
            One driver, one car, one transparent price.
            No surge. No parking. No wondering whether the next driver speaks your language.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-white/60"></th>
                {COLUMNS.map((c, i) => (
                  <th key={c} className={`px-3 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] ${i === 0 ? 'text-white' : 'text-white/60'}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {ROWS.map(r => (
                <tr key={r.label}>
                  <td className="px-5 py-3 text-left text-sm text-white/80">{r.label}</td>
                  <td className="px-3 py-3 text-center"><Cell on={r.hourly} /></td>
                  <td className="px-3 py-3 text-center"><Cell on={r.ride} /></td>
                  <td className="px-3 py-3 text-center"><Cell on={r.rental} /></td>
                  <td className="px-3 py-3 text-center"><Cell on={r.agency} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);
