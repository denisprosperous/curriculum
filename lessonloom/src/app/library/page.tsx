"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function LibraryPage() {
  const { data } = useSession();
  const userId = (data?.user as any)?.id;
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/library?userId=${userId}`).then(r => r.json()).then(d => setItems(d.items));
  }, [userId]);
  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">My Library</h1>
        <ul className="mt-4 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <div className="font-medium">{it.resource.title}</div>
                <div className="text-sm text-gray-600">{it.resource.sku}</div>
              </div>
              <a className="text-blue-600 underline" href={`/api/marketplace/download?userId=${userId}&resourceId=${it.resource.id}`}>Download</a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
