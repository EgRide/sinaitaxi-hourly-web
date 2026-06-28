import Link from 'next/link';
import Image from 'next/image';

export const SiteFooter: React.FC = () => (
  <footer className="mt-32 bg-brand-900 text-ink-300">
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="flex items-center gap-3">
          <Image
            src="/sinaitaxi-logo-light.png"
            alt="SinaiTaxi"
            width={180}
            height={32}
            className="h-8 w-auto"
          />
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/80">
            Hourly
          </span>
        </div>
        <p className="mt-4 max-w-md text-sm leading-relaxed">
          Chauffeured cars by the hour, half-day, full-day, or multi-day.
          Vetted partners, transparent pricing, one Sinai Taxi account.
        </p>
      </div>
      <FooterCol
        title="Product"
        links={[
          { label: 'Hourly home', href: '/' },
          { label: 'How it works', href: '/how-it-works' },
          { label: 'My rentals', href: '/account' },
          { label: 'Sinai Taxi rides', href: 'https://sinaitaxi.com' },
          { label: 'eSIM', href: 'https://esim.sinaitaxi.com' },
        ]}
      />
      <FooterCol
        title="Company"
        links={[
          { label: 'Support', href: '/support' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
          { label: 'Refunds', href: '/refunds' },
        ]}
      />
    </div>
    <div className="border-t border-white/10 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Sinai Taxi Ltd. All rights reserved.</span>
        <span>
          Sinai Taxi Ltd — company number 14825809 (England &amp; Wales). 71-75
          Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom.
        </span>
      </div>
    </div>
  </footer>
);

const FooterCol: React.FC<{ title: string; links: { label: string; href: string }[] }> = ({ title, links }) => (
  <div>
    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-white">{title}</h3>
    <ul className="space-y-2">
      {links.map(l => (
        <li key={l.href}>
          <Link href={l.href} className="text-sm hover:text-white">{l.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);
