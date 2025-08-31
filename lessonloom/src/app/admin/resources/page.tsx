"use client";
import { useEffect, useState } from 'react';

export default function AdminResourcesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ sku: '', title: '', description: '', priceCents: 0, subjectId: '', levelId: '', fileKey: '' });
  const load = async () => {
    const d = await fetch('/api/admin/resources').then(r => r.json());
    setItems(d.items);
  };
  useEffect(() => { load(); }, []);
  const submit = async () => {
    const res = await fetch('/api/admin/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ sku: '', title: '', description: '', priceCents: 0, subjectId: '', levelId: '', fileKey: '' }); load(); }
  };
  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold">Admin: Resources</h1>
        <div className="rounded border p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input className="rounded border p-2" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className="rounded border p-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="rounded border p-2" placeholder="Price (cents)" type="number" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value || 0) })} />
            <input className="rounded border p-2" placeholder="SubjectId (optional)" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} />
            <input className="rounded border p-2" placeholder="LevelId (optional)" value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })} />
            <input className="rounded border p-2" placeholder="File key/path" value={form.fileKey} onChange={(e) => setForm({ ...form, fileKey: e.target.value })} />
          </div>
          <textarea className="mt-2 w-full rounded border p-2" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="mt-2">
            <button onClick={submit} className="rounded bg-blue-600 px-3 py-2 text-white">Create</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="rounded border p-3">
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-gray-600">{it.sku}</div>
              <div className="mt-1 text-sm">${(it.priceCents/100).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
