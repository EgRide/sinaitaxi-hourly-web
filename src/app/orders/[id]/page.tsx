// Booking detail / receipt page. Server-fetches once, hands to the
// client-side poller. The poller watches status transitions from
// pending → confirmed once Stripe's webhook lands.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
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
        <main className="mx-auto max-w-3xl px-6 py-12">
          <span className="chip">Booking</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tighter">
            Hi {booking.customerName?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Reference {booking.id}</p>

          <div className="mt-8">
            <OrderPoller initial={booking} />
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
