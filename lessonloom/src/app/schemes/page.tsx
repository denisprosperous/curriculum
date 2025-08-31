import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

async function getSchemes() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ""}/api/schemes`, { cache: "no-store" });
  if (!res.ok) return [] as any[];
  const j = await res.json();
  return j.schemes as any[];
}

export default async function SchemesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <main className="p-6">
        <p>Please <Link className="text-blue-600" href="/sign-in">sign in</Link> to view your schemes.</p>
      </main>
    );
  }
  const schemes = await getSchemes();
  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Schemes</h1>
          <Link href="/schemes/new" className="rounded bg-blue-600 px-3 py-2 text-white">New Scheme</Link>
        </div>
        <div className="mt-6 divide-y rounded border">
          {schemes.length === 0 && (
            <div className="p-4 text-gray-600">No schemes yet.</div>
          )}
          {schemes.map((s) => (
            <Link key={s.id} href={`/schemes/${s.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <div className="font-medium">{s.subject.name} – {s.level.name}</div>
                <div className="text-sm text-gray-600">{new Date(s.startDate).toISOString().slice(0,10)} → {new Date(s.endDate).toISOString().slice(0,10)} · {s.lessonsPerWeek}/week</div>
              </div>
              <div className="text-sm text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

