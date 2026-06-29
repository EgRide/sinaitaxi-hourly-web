// Numbered pagination. Pure presentational — caller owns the
// current page, total count, and onChange. Renders previous /
// next chevrons + numbered buttons with sliding-window ellipsis
// so 1...4 5 6...20 stays compact at every scale.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  page: number;                        // 1-indexed
  pageSize: number;
  total: number;
  onChange: (next: number) => void;
  className?: string;
}

const buildPages = (current: number, last: number): (number | 'gap')[] => {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const out: (number | 'gap')[] = [];
  const window = 1;                              // pages either side of current
  const showLeftGap  = current - window > 2;
  const showRightGap = current + window < last - 1;
  out.push(1);
  if (showLeftGap) out.push('gap');
  const from = Math.max(2, current - window);
  const to   = Math.min(last - 1, current + window);
  for (let p = from; p <= to; p++) out.push(p);
  if (showRightGap) out.push('gap');
  out.push(last);
  return out;
};

export const Pagination: React.FC<Props> = ({ page, pageSize, total, onChange, className }) => {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pages = buildPages(page, lastPage);

  return (
    <nav className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-xs text-ink-500">
        Showing <strong className="text-ink-800">{start.toLocaleString()}</strong>–<strong className="text-ink-800">{end.toLocaleString()}</strong> of <strong className="text-ink-800">{total.toLocaleString()}</strong>
      </p>
      <ul className="inline-flex items-center gap-1">
        <li>
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 transition hover:border-ink-300 disabled:cursor-not-allowed disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden className="px-1.5 text-xs text-ink-400">…</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition',
                  p === page
                    ? 'bg-ink-900 text-white'
                    : 'border border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                )}>
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page >= lastPage}
            aria-label="Next page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 transition hover:border-ink-300 disabled:cursor-not-allowed disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
};
