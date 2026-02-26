import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "@/lib/constants";
import UserMenu from "@/components/UserMenu";
import { MobileNav } from "@/components/MobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2b6e57" },
    { media: "(prefers-color-scheme: dark)", color: "#1b3b31" },
  ],
};

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 print:bg-white print:text-black dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          <header className="border-b border-gray-200 bg-white print:hidden dark:border-gray-800 dark:bg-gray-900">
            <div className="safe-top mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2">
                <svg
                  className="h-8 w-8 text-brand-600 dark:text-brand-400"
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
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {APP_NAME}
                </span>
              </Link>
              <nav className="hidden items-center gap-4 md:flex">
                <Link
                  href="/"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Patterns
                </Link>
                <Link
                  href="/news"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  News
                </Link>
                <Link
                  href="/forum"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Forum
                </Link>
                <Link
                  href="/hatch"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Hatch Chart
                </Link>
                <Link
                  href="/reports"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Reports
                </Link>
                <Link
                  href="/learn"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Techniques
                </Link>
                <Link
                  href="/fly-box"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Fly Box
                </Link>
                <UserMenu />
              </nav>
              <div className="md:hidden">
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 pb-16 md:pb-0">{children}</main>

          <footer className="hidden border-t border-gray-200 bg-white print:hidden dark:border-gray-800 dark:bg-gray-900 md:block">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                  &copy; {new Date().getFullYear()} {APP_NAME}. All rights
                  reserved.
                </p>
                <p className="mt-1">
                  Free fly tying pattern database.
                </p>
              </div>
            </div>
          </footer>

          <div className="print:hidden">
            <MobileNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
