"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Catalog = {
  countries: Array<{
    id: string;
    code: string;
    name: string;
    examBoards: Array<{
      id: string;
      code: string;
      name: string;
      subjects: Array<{
        id: string;
        code: string;
        name: string;
        levels: Array<{ id: string; code: string; name: string }>;
      }>;
    }>;
  }>;
};

type UserCalendar = { id: string; name: string; year: number };

export default function NewSchemePage() {
  const { status } = useSession();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countryId, setCountryId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lessonsPerWeek, setLessonsPerWeek] = useState(5);
  const [weekdays, setWeekdays] = useState<number[]>([1,3,5]);
  const [calendars, setCalendars] = useState<UserCalendar[]>([]);
  const [userCalendarId, setUserCalendarId] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/catalog");
        if (!res.ok) throw new Error("Failed to load catalog");
        const json: Catalog = await res.json();
        if (!cancelled) setCatalog(json);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load catalog");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCalendars = async () => {
      try {
        const res = await fetch("/api/user-calendars", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) setCalendars(j.calendars || []);
      } catch {}
    };
    loadCalendars();
    return () => { cancelled = true; };
  }, []);

  const boards = useMemo(() => {
    return catalog?.countries.find((c) => c.id === countryId)?.examBoards ?? [];
  }, [catalog, countryId]);

  const subjects = useMemo(() => {
    return boards.find((b) => b.id === boardId)?.subjects ?? [];
  }, [boards, boardId]);

  const levels = useMemo(() => {
    return subjects.find((s) => s.id === subjectId)?.levels ?? [];
  }, [subjects, subjectId]);

  useEffect(() => {
    // Reset dependent selections when parent changes
    setBoardId("");
    setSubjectId("");
    setLevelId("");
  }, [countryId]);

  useEffect(() => {
    setSubjectId("");
    setLevelId("");
  }, [boardId]);

  useEffect(() => {
    setLevelId("");
  }, [subjectId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-scheme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          levelId,
          startDate,
          endDate,
          lessonsPerWeek,
          weekdays,
          userCalendarId: userCalendarId || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to generate scheme");
      }
      const j = await res.json();
      const id = j?.scheme?.id as string | undefined;
      if (id) router.push(`/schemes/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="p-6">
        <p>Loading…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold">Create a new scheme</h1>
          <p className="mt-4 text-gray-700">
            Please <Link className="text-blue-600" href="/sign-in">sign in</Link> to create a scheme.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Create a new scheme</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                className="mt-1 w-full rounded border p-2"
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                required
              >
                <option value="">Select country</option>
                {catalog?.countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Exam board</label>
              <select
                className="mt-1 w-full rounded border p-2"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                required
                disabled={!countryId}
              >
                <option value="">Select board</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <select
                className="mt-1 w-full rounded border p-2"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                disabled={!boardId}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <select
                className="mt-1 w-full rounded border p-2"
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                required
                disabled={!subjectId}
              >
                <option value="">Select level</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start date</label>
              <input
                type="date"
                className="mt-1 w-full rounded border p-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End date</label>
              <input
                type="date"
                className="mt-1 w-full rounded border p-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lessons per week</label>
            <input
              type="number"
              min={1}
              max={12}
              className="mt-1 w-full rounded border p-2 sm:w-48"
              value={lessonsPerWeek}
              onChange={(e) => setLessonsPerWeek(parseInt(e.target.value || "0", 10))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Weekdays</label>
            <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-7">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, idx) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={weekdays.includes(idx)}
                    onChange={(e) => {
                      setWeekdays((prev) => e.target.checked ? [...prev, idx] : prev.filter((x) => x !== idx));
                    }}
                  />
                  {d}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">Selected weekdays will be used for lesson dates; holidays are skipped.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Calendar (optional)</label>
            <select
              className="mt-1 w-full rounded border p-2 sm:w-96"
              value={userCalendarId}
              onChange={(e) => setUserCalendarId(e.target.value)}
            >
              <option value="">None</option>
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !levelId}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate scheme"}
            </button>
            <Link href="/" className="rounded border px-4 py-2">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

