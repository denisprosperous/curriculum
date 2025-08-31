"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Country = { id: string; name: string };

export default function CalendarEditorPage() {
  const { data } = useSession();
  const userId = (data?.user as any)?.id;
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [name, setName] = useState('My School Calendar');
  const [year, setYear] = useState<number>(2024);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [holidays, setHolidays] = useState<any[]>([]);
  const reload = async () => {
    if (!userId) return;
    const c = await fetch('/api/catalog').then(r => r.json());
    setCountries(c.countries.map((x: any) => ({ id: x.id, name: x.name })));
    const u = await fetch(`/api/calendars/user?userId=${userId}`).then(r => r.json());
    setCalendars(u.calendars);
  };
  useEffect(() => { reload(); }, [userId]);
  useEffect(() => {
    if (!countryId) return setTemplates([]);
    fetch(`/api/calendars/templates?countryId=${countryId}`).then(r => r.json()).then(d => setTemplates(d.templates));
  }, [countryId]);
  const createCalendar = async () => {
    if (!userId || !countryId) return;
    const res = await fetch('/api/calendars/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, countryId, templateId: templateId || undefined, name, year }) });
    if (res.ok) { await reload(); }
  };
  const selectCalendar = async (id: string) => {
    setSelectedCalendarId(id);
    const h = await fetch(`/api/calendars/holidays?calendarId=${id}`).then(r => r.json());
    setHolidays(h.holidays);
  };
  const addHoliday = async (name: string, date: string) => {
    if (!selectedCalendarId) return;
    const res = await fetch('/api/calendars/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calendarId: selectedCalendarId, name, date }) });
    if (res.ok) selectCalendar(selectedCalendarId);
  };
  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold">Calendar Editor</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600">Country</label>
            <select className="mt-1 w-full rounded border p-2" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
              <option value="">Select…</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Template</label>
            <select className="mt-1 w-full rounded border p-2" value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={!countryId}>
              <option value="">(Optional) Use national template…</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} {t.year}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Name</label>
            <input className="mt-1 w-full rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Year</label>
            <input type="number" className="mt-1 w-full rounded border p-2" value={year} onChange={(e) => setYear(parseInt(e.target.value || '2024', 10))} />
          </div>
        </div>
        <button onClick={createCalendar} className="rounded bg-indigo-600 px-3 py-2 text-white">Create calendar</button>
        <div>
          <h2 className="mt-6 text-xl font-medium">My calendars</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {calendars.map((cal: any) => (
              <button key={cal.id} onClick={() => selectCalendar(cal.id)} className={`rounded border p-3 text-left ${selectedCalendarId === cal.id ? 'border-indigo-600' : ''}`}>
                <div className="font-medium">{cal.name} ({cal.year})</div>
                <div className="text-sm text-gray-600">Term 1: {cal.term1Start?.slice?.(0,10)} → {cal.term1End?.slice?.(0,10)}</div>
              </button>
            ))}
          </div>
        </div>
        {selectedCalendarId && (
          <div>
            <h3 className="mt-6 text-lg font-medium">Holidays</h3>
            <HolidayEditor holidays={holidays} onAdd={addHoliday} />
          </div>
        )}
      </div>
    </main>
  );
}

function HolidayEditor({ holidays, onAdd }: { holidays: any[]; onAdd: (name: string, date: string) => void }) {
  const [hName, setHName] = useState('School Closure');
  const [hDate, setHDate] = useState('');
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="w-64 rounded border p-2" placeholder="Name" value={hName} onChange={(e) => setHName(e.target.value)} />
        <input type="date" className="rounded border p-2" value={hDate} onChange={(e) => setHDate(e.target.value)} />
        <button onClick={() => onAdd(hName, hDate)} className="rounded bg-blue-600 px-3 py-2 text-white">Add</button>
      </div>
      <ul className="space-y-1 text-sm">
        {holidays.map((h) => (<li key={h.id}>{h.date?.slice?.(0,10)} — {h.name}</li>))}
      </ul>
    </div>
  );
}
