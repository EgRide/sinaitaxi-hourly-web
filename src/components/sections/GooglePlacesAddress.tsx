'use client';

// Google Places address picker. Loads the Maps JS API on demand
// (script tag injected once per page lifetime), wires Autocomplete
// to the input, surfaces { description, lat, lng } back to the
// parent.
//
// PHP-side polygon resolution from this lat/lng is NOT done — PHP
// doesn't expose polygon geometry. The captured address is for
// the driver, not the routing engine.
//
// Falls back to a plain text input when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// is unset (dev convenience) so the form still works locally.

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

type Loader = Promise<typeof google.maps> | null;
let _loader: Loader = null;
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const loadGoogleMaps = (): Promise<typeof google.maps> => {
  if (_loader) return _loader;
  if (!KEY) {
    _loader = Promise.reject(new Error('Google Maps API key not configured'));
    return _loader;
  }
  _loader = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps requires window'));
      return;
    }
    if (window.google?.maps?.places) {
      resolve(window.google.maps);
      return;
    }
    // The classic `libraries=places` query string only auto-loads
    // the Places library under the legacy (non-`loading=async`)
    // bootstrap. We use that here because the modern bootstrap
    // requires `await google.maps.importLibrary('places')` plus a
    // dynamic-import shim that's overkill for one Autocomplete.
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = async () => {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }
      // If `libraries=places` didn't land for some reason (legacy
      // bootstrap behaviour can vary by region), fall back to the
      // modern importLibrary API.
      try {
        if (typeof window.google?.maps?.importLibrary === 'function') {
          await window.google.maps.importLibrary('places');
          if (window.google.maps.places) {
            resolve(window.google.maps);
            return;
          }
        }
      } catch (e) {
        reject(e as Error);
        return;
      }
      reject(new Error('Google Maps Places library failed to initialise'));
    };
    script.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(script);
  });
  return _loader;
};

interface Props {
  countryCode?: string;
  onChange: (address: string, latLng: { lat: number; lng: number } | null) => void;
}

export const GooglePlacesAddress: React.FC<Props> = ({ countryCode, onChange }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!KEY) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(maps => {
        if (cancelled || !inputRef.current) return;
        // Bias suggestions toward the selected country so results
        // are local and relevant. Customer can still type any
        // global address — country bias is a suggestion ranker,
        // not a hard restriction.
        acRef.current = new maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry'],
          ...(countryCode ? { componentRestrictions: { country: countryCode.toLowerCase() } } : {}),
        });
        acRef.current.addListener('place_changed', () => {
          const place = acRef.current?.getPlace();
          const address = place?.formatted_address ?? inputRef.current?.value ?? '';
          const loc = place?.geometry?.location;
          const latLng = loc ? { lat: loc.lat(), lng: loc.lng() } : null;
          onChange(address, latLng);
        });
      })
      .catch((e: Error) => setError(e.message));
    return () => { cancelled = true; };
    // We rebuild Autocomplete when the country changes so the
    // bias updates. Dropping the onChange dep to avoid a churn
    // loop — it's a stable callback in the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  return (
    <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        <MapPin className="h-3.5 w-3.5" />
        Pickup address (for the driver)
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder={KEY ? 'Hotel, address, or landmark' : 'Type your pickup address'}
        onChange={e => onChange(e.target.value, null)}
        className="mt-1 w-full bg-transparent text-base outline-none placeholder:text-ink-400"
      />
      {!KEY ? (
        <p className="mt-1 text-[10px] text-ink-400">
          Address autocomplete disabled — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable.
        </p>
      ) : error ? (
        <p className="mt-1 text-[10px] text-red-500">{error}</p>
      ) : null}
    </label>
  );
};
