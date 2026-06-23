'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const HIDE_ON = ['/admin', '/partner'];

export const WhatsAppFab: React.FC = () => {
  const path = usePathname();
  if (HIDE_ON.some(p => path?.startsWith(p))) return null;
  const href = 'https://wa.me/441908380111?text=' + encodeURIComponent('I need help with Hourly rental');
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-emerald-600">
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Need help?</span>
    </a>
  );
};
