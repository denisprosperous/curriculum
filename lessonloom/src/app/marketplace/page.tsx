"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function MarketplacePage() {
  const { data } = useSession();
  const userId = (data?.user as any)?.id;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/marketplace/list').then(r => r.json()).then(d => { setItems(d.items); setLoading(false); });
  }, []);
  const purchase = async (resourceId: string) => {
    if (!userId) return alert('Sign in first');
    const provider = (document.getElementById('provider') as HTMLSelectElement)?.value || 'stripe';
    const endpoint = provider === 'paystack' ? '/api/payments/paystack/checkout' : provider === 'flutterwave' ? '/api/payments/flutterwave/checkout' : '/api/payments/stripe/checkout';
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, resourceId, mode: 'stub' }) });
    if (res.ok) {
      const j = await res.json();
      if (j.checkoutUrl) window.location.href = j.checkoutUrl;
      else alert('Purchased! Check your library.');
    }
  };
  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <div className="mt-2 text-sm">
          Payment provider:
          <select id="provider" className="ml-2 rounded border px-2 py-1">
            <option value="stripe">Stripe (global)</option>
            <option value="paystack">Paystack (WA)</option>
            <option value="flutterwave">Flutterwave (EA)</option>
          </select>
        </div>
        {loading ? <p className="mt-4 text-gray-600">Loading…</p> : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {items.map((it) => (
              <div key={it.id} className="rounded border p-4">
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-gray-600">{it.subject?.name} {it.level?.name ? `– ${it.level?.name}` : ''}</div>
                <div className="mt-2 text-sm">{it.description}</div>
                <div className="mt-2 font-semibold">${(it.priceCents/100).toFixed(2)}</div>
                <div className="mt-3 space-x-2">
                  <a href={`/api/marketplace/download?userId=${userId || 'preview'}&resourceId=${it.id}&preview=1`} className="rounded border px-3 py-1 text-sm">Preview</a>
                  <button onClick={() => purchase(it.id)} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">Buy</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
