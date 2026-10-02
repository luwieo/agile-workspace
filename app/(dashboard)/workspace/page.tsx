import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createWorkspace, addWorkspaceMember, getWorkspaceMembers } from './actions'

type WorkspaceMember = {
    userId: string
    name: string
    role?: string
}

export default async function WorkspacePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Query workspace memberships with safe typing
    const { data: memberships } = await (supabase
        .from('workspace_members') as any)
        .select('workspace_id, role, workspaces(id, name, slug)')
        .eq('user_id', user.id)

    const workspaces: { id: string; name: string; role?: string }[] =
        memberships
            ?.map((m: any) => ({
                ...m.workspaces,
                role: m.role,
            }))
            .filter((w: any): w is { id: string; name: string; role?: string } => Boolean(w && w.id)) || []

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
    const members = await getWorkspaceMembers(activeWorkspace.id)

    return (
        <div className="p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Workspace Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">{activeWorkspace.name}</h1>
                        <p className="mt-1 text-slate-500">
                            Authenticated as: <span className="font-medium text-teal-600">{user.email}</span>
                        </p>
                    </div>

                    {/* Quick Member Add Form */}
                    <form action={addWorkspaceMember} className="flex items-center gap-2">
                        <input type="hidden" name="workspaceId" value={activeWorkspace.id} />
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="Teammate's email..."
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                        />
                        <button
                            type="submit"
                            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]"
                        >
                            + Add Member
                        </button>
                    </form>
                </div>

                {/* Dashboard Navigation Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Link href={`/workspace/kanban?workspaceId=${activeWorkspace.id}`} className="block">
                        <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-slate-800">Kanban Board</h3>
                            <p className="mt-1 text-sm text-slate-500">Manage sprint tasks with interactive drag-and-drop columns.</p>
                        </div>
                    </Link>
                    <Link href={`/workspace/backlog?workspaceId=${activeWorkspace.id}`} className="block">
                        <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-slate-800">Project Backlog</h3>
                            <p className="mt-1 text-sm text-slate-500">Draft and store unscheduled tasks and user stories.</p>
                        </div>
                    </Link>
                </div>

                {/* Workspace Members Directory */}
                {/* Member Add Form with Role Selector */}
                <form action={addWorkspaceMember} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="workspaceId" value={activeWorkspace.id} />

                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="Teammate's email..."
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                    />

                    <select
                        name="role"
                        required
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 capitalize"
                    >
                        {/* Replace/adjust these values with your actual database enum labels */}
                        <option value="developer">Developer</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                    </select>

                    <button
                        type="submit"
                        className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]"
                    >
                        + Add Member
                    </button>
                </form>
            </div>
        </div>
    )
}