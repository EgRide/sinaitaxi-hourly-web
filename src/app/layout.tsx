import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sinai Taxi Hourly — Car + driver by the hour',
    template: '%s · Sinai Taxi Hourly',
  },
  description:
    'Book a chauffeured car by the hour. Half-day, full-day, or multi-day rentals with a vetted driver — Mozio-style marketplace, Sinai Taxi quality.',
  metadataBase: new URL('https://hourly.sinaitaxi.com'),
  openGraph: {
    title: 'Sinai Taxi Hourly — Car + driver by the hour',
    description: 'Book a chauffeured car by the hour, half-day, full-day, or multi-day.',
    type: 'website',
    locale: 'en_US',
    url: 'https://hourly.sinaitaxi.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
