import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createWorkspace } from './actions'
import WorkspaceList from '@/components/workspace-list'

export default async function WorkspacePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: memberships } = await (supabase
        .from('workspace_members') as any)
        .select('role, workspaces(id, name, slug, owner_id)')
        .eq('user_id', user.id)

    const workspaces = (memberships || [])
        .map((m: any) => ({
            ...m.workspaces,
            role: m.role,
            isOwned: m.workspaces?.owner_id === user.id,
        }))
        .filter((w: any) => Boolean(w?.id))

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
                        <button type="submit" className="w-full rounded-xl bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]">
                            Create Workspace
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Workspaces</h1>
                        <p className="mt-1 text-slate-500">
                            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} accessible to{' '}
                            <span className="font-medium text-teal-600">{user.email}</span>
                        </p>
                    </div>
                    <form action={createWorkspace} className="flex items-center gap-2">
                        <input
                            name="name"
                            required
                            placeholder="New workspace name..."
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                        <button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]">
                            + New
                        </button>
                    </form>
                </div>

                <WorkspaceList workspaces={workspaces} />
            </div>
        </div>
    )
}