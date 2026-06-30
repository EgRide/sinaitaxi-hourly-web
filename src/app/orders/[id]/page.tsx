// Booking detail / receipt page. Server-fetches once, hands to the
// client-side poller. The poller watches status transitions from
// pending → confirmed once Stripe's webhook lands.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Reveal } from '@/components/Reveal';
import { api, ApiError } from '@/lib/api';
import { OrderPoller } from './OrderPoller';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Booking ${id}`, robots: { index: false } };
}

export default async function OrderPage({ params }: { params: Params }) {
  const { id } = await params;
  try {
    const booking = await api.booking(id);
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-[#070912] text-white">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
                Booking
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tighter text-white">
                Hi <span className="text-gradient">{booking.customerName?.split(' ')[0] ?? 'there'}</span>
              </h1>
              <p className="mt-1 text-sm text-white/45">Reference {booking.id}</p>
            </Reveal>

            <div className="mt-8">
              <OrderPoller initial={booking} />
            </div>
          </div>
        </main>
        <SiteFooter />
        <WhatsAppFab />
      </>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
