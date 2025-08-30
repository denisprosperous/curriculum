"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (res?.error) setError(res.error);
    if (res?.ok) window.location.href = '/';
  };

  return (
    <main className="p-6">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          No account? <Link href="/sign-up" className="text-blue-600">Create one</Link>
        </p>
      </div>
    </main>
  );
}
