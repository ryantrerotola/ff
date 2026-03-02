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
                  className="h-8 w-8"
                  viewBox="0 0 32 32"
                  fill="none"
                  aria-hidden="true"
                >
                  {/* Left wing — brand green */}
                  <path
                    d="M13 27Q7 20 8 12Q9 5 15 3Q12 8 12 15Q12 22 13 27Z"
                    className="fill-brand-600 dark:fill-brand-400"
                  />
                  {/* Right wing — gold accent */}
                  <path
                    d="M18 24Q14 18 16 11Q18 5 24 4Q20 8 19 14Q18 20 18 24Z"
                    className="fill-accent-400 dark:fill-accent-300"
                    opacity="0.75"
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
