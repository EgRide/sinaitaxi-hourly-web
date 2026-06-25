'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { adminApi, adminSession } from '@/lib/admin-api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminSession.token) router.replace('/admin');
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await adminApi.login({ email: email.trim(), password });
      adminSession.set(r.token);
      router.replace('/admin');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[60vh] bg-ink-50/40 grid place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white border border-ink-100 shadow-soft p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-ink-900 text-white font-bold">
              ST
            </span>
            <div>
              <h1 className="font-extrabold tracking-tight text-lg leading-tight">
                Sinai<span className="text-brand-500">Taxi</span> Ops
              </h1>
              <p className="text-xs text-ink-500 font-medium">Hourly Rental admin</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1">Sign in</h2>
          <p className="text-sm text-ink-500 mb-6">
            Use your Sinai Taxi admin credentials. Access is restricted to allowlisted ops emails.
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Email</span>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-ink-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required autoFocus
                  className="w-full bg-transparent text-base outline-none" />
              </div>
            </label>

            <label className="block rounded-2xl border border-ink-200 bg-white px-4 py-3 focus-within:border-brand-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Password</span>
              <div className="mt-1 flex items-center gap-2">
                <Lock className="h-4 w-4 text-ink-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required
                  className="w-full bg-transparent text-base outline-none" />
              </div>
            </label>

            {error ? (
              <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5">
              {busy ? 'Signing in…' : (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-ink-500">
          Partner? <Link href="/partner/login" className="font-semibold text-ink-700 hover:text-ink-900">Partner login</Link>
        </p>
      </div>
    </div>
  );
}
