'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { login } from '../actions'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            {/* Decorative background blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md rounded-2xl border border-slate-200/60 bg-white/70 p-8 shadow-lg backdrop-blur-md">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Welcome back</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Sign in to access your projects and retrospectives.
                </p>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex gap-2">
                    <button
                        type="button"
                        onClick={() => { setEmail('scrum.owner@agile.com'); setPassword('Pass123!') }}
                        className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                        Demo: Owner
                    </button>
                    <button
                        type="button"
                        onClick={() => { setEmail('scrum.dev@agile.com'); setPassword('Pass123!') }}
                        className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                        Demo: Developer
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-600">
                            Username or Email
                        </label>
                        <input
                            type="text"
                            name="emailOrUsername"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email or @username"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-xl bg-navy py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-light disabled:opacity-50"
                    >
                        {isPending ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/signup"
                        className="font-medium text-teal-600 underline decoration-teal-600/30 underline-offset-2 hover:text-teal-500 hover:decoration-teal-500/50"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}