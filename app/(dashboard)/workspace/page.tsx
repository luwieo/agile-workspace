import { createClient } from '@/lib/supabase/server'

export default async function WorkspacePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return (
        <div className="p-8">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-3xl font-bold tracking-tight text-slate-800">Workspace</h1>
                <p className="mt-2 text-slate-500">
                    Authenticated as: <span className="font-medium text-teal-600">{user?.email}</span>
                </p>

                {/* Scaffolding Cards */}
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Kanban Board Card */}
                    <div className="group rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-md transition hover:border-teal-200 hover:shadow-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">Kanban Board</h3>
                        <p className="mt-1 text-sm text-slate-500">Visualize and manage your sprint tasks with drag-and-drop columns.</p>
                    </div>

                    {/* Retrospective Card */}
                    <div className="group rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-md transition hover:border-teal-200 hover:shadow-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">Retrospectives</h3>
                        <p className="mt-1 text-sm text-slate-500">Reflect on sprints with your team. Capture what went well and areas to improve.</p>
                    </div>

                    {/* Team Card */}
                    <div className="group rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-md transition hover:border-teal-200 hover:shadow-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">Team</h3>
                        <p className="mt-1 text-sm text-slate-500">Manage team members, roles, and permissions for your workspace.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}