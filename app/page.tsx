import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-white text-xl font-bold mb-4">
            A
          </div>
          <h1 className="text-4xl font-bold mb-3">Adflo Estimator</h1>
          <p className="text-lg text-gray-600">
            TapClicks Implementation Tool
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="block w-full rounded-lg border px-4 py-3 text-center font-medium hover:bg-gray-50"
          >
            Team sign in
          </Link>

          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Client questionnaire</h2>
            <p className="text-sm text-gray-600 mb-3">
              Clients should use their unique questionnaire link. No login needed.
            </p>
            <p className="text-xs text-gray-500 break-all">
              Example: /q/your-share-token
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}