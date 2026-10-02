import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createWorkspace } from './actions'

export default async function WorkspacePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Query workspace memberships with safe typing
    const { data: memberships } = await (supabase
        .from('workspace_members') as any)
        .select('workspace_id, role, workspaces(id, name)')
        .eq('user_id', user.id)

    const workspaces: { id: string; name: string }[] =
        memberships
            ?.map((m: any) => m.workspaces)
            .filter((w: any): w is { id: string; name: string } => Boolean(w && w.id)) || []

    // Prompt to create a workspace if user has none
    if (workspaces.length === 0) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-8">
                <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-800">Create your Workspace</h2>
                    <p className="mt-1 text-sm text-slate-500">Set up a workspace to manage projects and sprint boards.</p>

                    <form action={createWorkspace} className="mt-6 flex flex-col gap-4 text-left">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Workspace Name</label>
                            <input
                                name="name"
                                required
                                placeholder="e.g. AgileSpace Team"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]"
                        >
                            Create Workspace
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    const activeWorkspace = workspaces[0]

    return (
        <div className="p-8">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">{activeWorkspace.name}</h1>
                        <p className="mt-1 text-slate-500">
                            Authenticated as: <span className="font-medium text-teal-600">{user.email}</span>
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Link href={`/workspace/kanban?workspaceId=${activeWorkspace.id}`} className="block">
                        <div className="group rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-md transition hover:border-teal-200 hover:shadow-md">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#1e3a5f]">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-slate-800">Kanban Board</h3>
                            <p className="mt-1 text-sm text-slate-500">Manage sprint tasks with columns tied to this workspace.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}