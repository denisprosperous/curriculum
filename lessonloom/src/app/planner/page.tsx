"use client";
import { useEffect, useState } from 'react';

type Country = { id: string; name: string; examBoards: { id: string; name: string; subjects: { id: string; name: string; levels: { id: string; name: string }[] }[] }[] };

export default function PlannerPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState<string>('');
  const [boardId, setBoardId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [levelId, setLevelId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [lessonsPerWeek, setLessonsPerWeek] = useState<number>(5);
  const [schemeId, setSchemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/catalog').then(r => r.json()).then(d => setCountries(d.countries as Country[]));
  }, []);

  const selectedCountry = countries.find(c => c.id === countryId);
  const boards = selectedCountry?.examBoards ?? [];
  const subjects = boards.find(b => b.id === boardId)?.subjects ?? [];
  const levels = subjects.find(s => s.id === subjectId)?.levels ?? [];

  const generate = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/generate-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, levelId, startDate, endDate, lessonsPerWeek }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const j = await res.json();
      setSchemeId(j.scheme.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">Planner</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600">Country</label>
            <select className="mt-1 w-full rounded border p-2" value={countryId} onChange={(e) => { setCountryId(e.target.value); setBoardId(''); setSubjectId(''); setLevelId(''); }}>
              <option value="">Select…</option>
              {countries.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Exam Board</label>
            <select className="mt-1 w-full rounded border p-2" value={boardId} onChange={(e) => { setBoardId(e.target.value); setSubjectId(''); setLevelId(''); }} disabled={!countryId}>
              <option value="">Select…</option>
              {boards.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Subject</label>
            <select className="mt-1 w-full rounded border p-2" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setLevelId(''); }} disabled={!boardId}>
              <option value="">Select…</option>
              {subjects.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Level</label>
            <select className="mt-1 w-full rounded border p-2" value={levelId} onChange={(e) => setLevelId(e.target.value)} disabled={!subjectId}>
              <option value="">Select…</option>
              {levels.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Start date</label>
            <input type="date" className="mt-1 w-full rounded border p-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600">End date</label>
            <input type="date" className="mt-1 w-full rounded border p-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Lessons per week</label>
            <input type="number" min={1} max={12} className="mt-1 w-full rounded border p-2" value={lessonsPerWeek} onChange={(e) => setLessonsPerWeek(parseInt(e.target.value || '1', 10))} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={generate} disabled={loading || !levelId || !startDate || !endDate} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
          {loading ? 'Generating…' : 'Generate scheme'}
        </button>
        {schemeId && (
          <div className="space-x-3">
            <a className="text-blue-600 underline" href={`/api/export/docx?schemeId=${schemeId}`}>Download DOCX</a>
            <a className="text-blue-600 underline" href={`/api/export/pdf?schemeId=${schemeId}`}>Download PDF</a>
          </div>
        )}
      </div>
    </main>
  );
}
