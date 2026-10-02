import Link from 'next/link'

export default function Home() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 text-center">
            {/* Decorative background blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-teal-200/20 blur-3xl" />
                <div className="absolute -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full bg-sky-200/20 blur-3xl" />
            </div>

            <div className="relative">
                <h1 className="text-5xl font-bold tracking-tight text-slate-800 sm:text-6xl">
                    Agile<span className="text-teal-600">Space</span>
                </h1>
                <p className="mx-auto mt-4 max-w-md text-lg text-slate-500">
                    Collaborative agile workspace for teams. Kanban boards, retrospectives, and more.
                </p>

                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link
                        href="/login"
                        className="flex h-12 w-full items-center justify-center rounded-xl bg-navy px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-light sm:w-auto"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/signup"
                        className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-8 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-teal-300 hover:bg-slate-50 sm:w-auto"
                    >
                        Create account
                    </Link>
                </div>
            </div>
        </div>
    )
}
