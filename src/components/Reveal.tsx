'use client';

// Scroll-reveal wrapper. Children start translated + transparent and
// animate in once they enter the viewport (IntersectionObserver, fires
// once). Pair with the `.reveal` utility in globals.css. Use `delay` to
// stagger siblings. Respects prefers-reduced-motion via the CSS.
import { useEffect, useRef, useState } from 'react';

export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number; // ms
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
};
