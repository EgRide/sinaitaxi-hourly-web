// Tier treatment for vehicle classes. Business / Executive (and other
// premium tiers) get a gold "VIP" badge in our brand accent; electric
// classes get a green "Electric" badge. Classification is name/slug
// based — no backend flag — so it works for any PHP-synced class plus
// our seeded electric demo class.

import { Crown, Zap } from 'lucide-react';

export type ClassTier = 'vip' | 'electric';

export const classTier = (...parts: (string | null | undefined)[]): ClassTier | null => {
  const s = parts.filter(Boolean).join(' ').toLowerCase();
  if (!s) return null;
  if (/electric|hybrid|\bev\b|tesla/.test(s)) return 'electric';
  if (/business|executive|first[ -]?class|luxury|premium|\bvip\b/.test(s)) return 'vip';
  return null;
};

// Border classes for cards, so the whole tile reads as "privileged".
export const tierBorderClass = (tier: ClassTier | null): string =>
  tier === 'vip' ? 'border-accent-400'
  : tier === 'electric' ? 'border-emerald-300'
  : 'border-ink-100';

export const ClassBadge: React.FC<{ tier: ClassTier; className?: string }> = ({ tier, className = '' }) => {
  if (tier === 'electric') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 ${className}`}>
        <Zap className="h-3 w-3 fill-current" />
        Electric
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-900 shadow-sm ${className}`}>
      <Crown className="h-3 w-3 fill-current" />
      VIP
    </span>
  );
};
