import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">LessonLoom</h1>
        <p className="mt-2 text-gray-600">Generate localized, exam-board–aligned schemes of work in minutes.</p>
        <div className="mt-6">
          {session ? (
            <div className="space-y-2">
              <p className="text-green-700">Signed in as {session.user?.email}</p>
              <Link href="/planner" className="rounded bg-indigo-600 px-3 py-2 text-white">Open Planner</Link>
            </div>
          ) : (
            <div className="space-x-3">
              <Link href="/sign-in" className="rounded bg-blue-600 px-3 py-2 text-white">Sign in</Link>
              <Link href="/sign-up" className="rounded border px-3 py-2">Create account</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
