import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              &larr; Back to Site
            </Link>
            <span className="text-sm text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-gray-900">
              Pipeline Admin
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/review"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Review Queue
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
