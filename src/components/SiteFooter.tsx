import Link from 'next/link';

export const SiteFooter: React.FC = () => (
  <footer className="mt-32 bg-brand-900 text-ink-300">
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="text-2xl font-extrabold tracking-tighter text-white">
          Sinai<span className="text-brand-400">Taxi</span> Hourly
        </div>
        <p className="mt-3 max-w-md text-sm leading-relaxed">
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
          { label: 'Support', href: 'mailto:sales@sinaitaxi.com' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
          { label: 'Refunds', href: '/refund-policy' },
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
