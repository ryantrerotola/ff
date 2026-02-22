import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "@/lib/constants";
import UserMenu from "@/components/UserMenu";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Fly Tying Pattern Database`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: `${APP_NAME} — Fly Tying Pattern Database`,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="h-8 w-8 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              <span className="text-xl font-bold text-gray-900">
                {APP_NAME}
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Patterns
              </Link>
              <Link
                href="/news"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                News
              </Link>
              <Link
                href="/forum"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Forum
              </Link>
              <Link
                href="/hatch"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Hatch Chart
              </Link>
              <UserMenu />
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
              <p className="mt-1">
                Free fly tying pattern database. Some links are affiliate links.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
