export const metadata = {
  title: "Offline — FlyPatternDB",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <svg
        className="mb-6 h-16 w-16 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <h1 className="text-2xl font-bold text-gray-900">
        You&apos;re Offline
      </h1>
      <p className="mt-3 max-w-md text-gray-600">
        It looks like you&apos;ve lost your internet connection. Previously
        viewed patterns may still be available. Check your connection and try
        again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Try Again
      </button>
    </div>
  );
}
