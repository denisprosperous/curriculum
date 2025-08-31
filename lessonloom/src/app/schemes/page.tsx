import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

type SchemeListItem = { id: string; createdAt: string; startDate: string; endDate: string; lessonsPerWeek: number; subject: { name: string }; level: { name: string } };
async function getSchemes(page = 1): Promise<{ schemes: SchemeListItem[]; page: number; totalPages: number }> {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ""}/api/schemes?page=${page}`, { cache: "no-store" });
  if (!res.ok) return { schemes: [], page: 1, totalPages: 1 };
  const j = await res.json();
  return j;
}

export default async function SchemesPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <main className="p-6">
        <p>Please <Link className="text-blue-600" href="/sign-in">sign in</Link> to view your schemes.</p>
      </main>
    );
  }
  const currentPage = parseInt((Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page) || '1', 10) || 1;
  const { schemes, page, totalPages } = await getSchemes(currentPage);
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
          {schemes.map((s: SchemeListItem) => (
            <Link key={s.id} href={`/schemes/${s.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <div className="font-medium">{s.subject.name} – {s.level.name}</div>
                <div className="text-sm text-gray-600">{new Date(s.startDate).toISOString().slice(0,10)} → {new Date(s.endDate).toISOString().slice(0,10)} · {s.lessonsPerWeek}/week</div>
              </div>
              <div className="text-sm text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <Link href={`/schemes?page=${Math.max(1, page - 1)}`} className="rounded border px-2 py-1">Previous</Link>
            <Link href={`/schemes?page=${Math.min(totalPages, page + 1)}`} className="rounded border px-2 py-1">Next</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

