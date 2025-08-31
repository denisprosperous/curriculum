import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export const metadata: Metadata = {
  title: 'LessonLoom',
  description: 'Localized schemes of work and ready-to-teach resources',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Providers>
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
              <Link href="/" className="font-semibold">LessonLoom</Link>
              <nav className="flex items-center gap-3 text-sm">
                <Link href="/schemes" className="hover:underline">Schemes</Link>
                {session ? (
                  <form action="/api/auth/signout" method="post">
                    <button className="rounded border px-3 py-1">Sign out</button>
                  </form>
                ) : (
                  <Link href="/sign-in" className="rounded border px-3 py-1">Sign in</Link>
                )}
              </nav>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
