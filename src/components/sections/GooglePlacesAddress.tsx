'use client';

// Google Places address picker. Loads the Maps JS API once per
// page lifetime, wires Autocomplete to the input, and surfaces
// a structured ResolvedPlace back to the parent:
//
//   {
//     formattedAddress, lat, lng,
//     countryCode, locality, sublocality, administrativeArea,
//   }
//
// The parent calls /v1/resolve-address with these fields to figure
// out which polygon the address sits in. PHP doesn't expose polygon
// geometry, so locality / sublocality are the primary match keys.
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
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = async () => {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }
      try {
        if (typeof window.google?.maps?.importLibrary === 'function') {
          await window.google.maps.importLibrary('places');
          if (window.google.maps.places) { resolve(window.google.maps); return; }
        }
      } catch (e) { reject(e as Error); return; }
      reject(new Error('Google Maps Places library failed to initialise'));
    };
    script.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(script);
  });
  return _loader;
};

export interface ResolvedPlace {
  formattedAddress: string;
  lat: number;
  lng: number;
  countryCode: string;             // ISO-2 from address_components
  locality: string | null;         // typically the city
  sublocality: string | null;      // typically the neighbourhood
  administrativeArea: string | null;
}

const extractComponent = (
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
  useShortName = false,
): string | null => {
  if (!components) return null;
  const c = components.find(x => x.types.includes(type));
  if (!c) return null;
  return useShortName ? c.short_name : c.long_name;
};

interface Props {
  onResolve: (place: ResolvedPlace) => void;
  // Free-text edits (no place selected yet) bubble up so the parent
  // can capture partial input; resolution waits for a real place pick.
  onTextChange?: (text: string) => void;
}

export const GooglePlacesAddress: React.FC<Props> = ({ onResolve, onTextChange }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!KEY) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(maps => {
        if (cancelled || !inputRef.current) return;
        acRef.current = new maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'address_components'],
          // No country restriction — the customer might paste an
          // address from anywhere. The server decides whether the
          // resolved country is in our operating set.
        });
        acRef.current.addListener('place_changed', () => {
          const place = acRef.current?.getPlace();
          if (!place) return;
          const loc = place.geometry?.location;
          if (!loc || !place.address_components) {
            setError("Couldn't read this location — try a more specific address.");
            return;
          }
          const components = place.address_components;
          const countryShort = extractComponent(components, 'country', true);
          if (!countryShort) {
            setError("Couldn't determine country — try a different address.");
            return;
          }
          setError(null);
          onResolve({
            formattedAddress: place.formatted_address ?? inputRef.current?.value ?? '',
            lat: loc.lat(),
            lng: loc.lng(),
            countryCode: countryShort.toUpperCase(),
            locality: extractComponent(components, 'locality'),
            sublocality:
              extractComponent(components, 'sublocality')
              ?? extractComponent(components, 'sublocality_level_1')
              ?? extractComponent(components, 'neighborhood'),
            administrativeArea: extractComponent(components, 'administrative_area_level_1'),
          });
        });
      })
      .catch((e: Error) => setError(e.message));
    return () => { cancelled = true; };
  }, [onResolve]);

  return (
    <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        <MapPin className="h-3.5 w-3.5" />
        Pickup location
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder={KEY ? 'Type a hotel, address, or landmark' : 'Type your pickup address'}
        onChange={e => onTextChange?.(e.target.value)}
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
