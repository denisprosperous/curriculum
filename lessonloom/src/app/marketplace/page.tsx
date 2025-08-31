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
    const res = await fetch('/api/marketplace/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, resourceId }) });
    if (res.ok) alert('Purchased! Check your library.');
  };
  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Marketplace</h1>
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
