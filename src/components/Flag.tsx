// Flag — twemoji SVGs sourced from the public CDN. Falls back to
// the OS emoji glyph if the SVG fails to load. Twemoji renders
// consistently across Windows / Linux / Android where native
// flag emoji are often missing or rendered as letter pairs.
import { cn } from '@/lib/cn';

interface Props {
  code: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-4 w-6',
  md: 'h-6 w-9',
  lg: 'h-8 w-12',
  xl: 'h-12 w-16',
};

export const Flag: React.FC<Props> = ({ code, className, size = 'md' }) => {
  const c = code.trim().toLowerCase();
  if (c.length !== 2) return null;
  const cp = (s: string) => 127397 + s.charCodeAt(0);
  const fallback = String.fromCodePoint(cp(c[0]!.toUpperCase()), cp(c[1]!.toUpperCase()));
  const unicode = `${(0x1f1e6 + (c.charCodeAt(0) - 97)).toString(16)}-${(0x1f1e6 + (c.charCodeAt(1) - 97)).toString(16)}`;
  return (
    <span className={cn('relative inline-block overflow-hidden rounded-md ring-1 ring-ink-200/70', SIZE[size], className)}>
      <span aria-hidden className="absolute inset-0 grid place-items-center text-base bg-ink-100">
        {fallback}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14/assets/svg/${unicode}.svg`}
        alt={`${code} flag`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </span>
  );
};
