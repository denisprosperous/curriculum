import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

async function getScheme(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ""}/api/schemes/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const j = await res.json();
  return j.scheme as any;
}

export default async function SchemeDetail({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  const scheme = await getScheme(params.id);
  if (!scheme) notFound();
  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{scheme.subject.name} – {scheme.level.name}</h1>
            <p className="text-gray-600">{new Date(scheme.startDate).toISOString().slice(0,10)} → {new Date(scheme.endDate).toISOString().slice(0,10)} · {scheme.lessonsPerWeek}/week</p>
          </div>
          <div className="flex gap-2">
            <a href={`/api/export/pdf?schemeId=${scheme.id}`} className="rounded border px-3 py-2">Export PDF</a>
            <a href={`/api/export/docx?schemeId=${scheme.id}`} className="rounded border px-3 py-2">Export DOCX</a>
          </div>
        </div>

        <div className="rounded border">
          {scheme.weeks.map((w: any) => (
            <div key={w.id} className="border-b p-4 last:border-0">
              <div className="mb-2 font-medium">Week {w.weekNumber}</div>
              {w.entries.length === 0 ? (
                <div className="text-sm text-gray-500">No entries</div>
              ) : (
                <ol className="list-inside list-decimal space-y-1">
                  {w.entries.map((e: any) => (
                    <li key={e.id}>{e.topic} – {e.subtopic}: {e.objective}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Link href="/schemes" className="text-blue-600">Back to list</Link>
          <form action={`/api/schemes/${scheme.id}`} method="POST" onSubmit={(e) => {
            if (!confirm('Delete this scheme?')) e.preventDefault();
          }}>
            <input type="hidden" name="_method" value="DELETE" />
            <button
              formAction="#"
              onClick={async (e) => {
                e.preventDefault();
                if (!confirm('Delete this scheme?')) return;
                await fetch(`/api/schemes/${scheme.id}`, { method: 'DELETE' });
                window.location.href = '/schemes';
              }}
              className="rounded bg-red-600 px-3 py-2 text-white"
            >Delete</button>
          </form>
        </div>
      </div>
    </main>
  );
}

