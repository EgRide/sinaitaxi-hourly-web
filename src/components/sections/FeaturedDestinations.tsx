// Operating-countries grid — mirrors the eSIM CountryGrid pattern.
// Region chips at the top (Europe / Asia / Americas / Africa /
// Oceania), all live operating countries below, each card shows
// flag + name + "N cities" + arrow. Click → /destinations/[code].
//
// Server component fetches once (per ISR cache), passes to the
// client-side filter shell so chip switching is instant.

import { api, type Country } from '@/lib/api';
import { CountryGridClient } from './CountryGridClient';

async function loadCountries(): Promise<{ countries: Country[]; error: string | null }> {
  try {
    const r = await api.countries();
    return { countries: r.countries, error: null };
  } catch (err) {
    return { countries: [], error: (err as Error).message };
  }
}

export const FeaturedDestinations: React.FC = async () => {
  const { countries, error } = await loadCountries();
  return <CountryGridClient countries={countries} error={error} />;
};
