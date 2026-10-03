import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createWorkspace } from './actions'
import WorkspaceList from '@/components/workspace-list'
import CreateWorkspaceButton from '@/components/create-workspace-button'

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
            <div className="flex h-[calc(100vh-4rem)] flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard</h1>
                    <CreateWorkspaceButton />
                </div>
                <div className="flex flex-1 items-center justify-center p-8">
                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-xl font-semibold text-slate-800">No Workspaces Yet</h2>
                        <p className="mt-2 mb-8 max-w-sm text-sm text-slate-500">
                            You aren't a member of any workspaces. Create one to get started with your team's sprint boards.
                        </p>
                        <CreateWorkspaceButton variant="empty-state" />
                    </div>
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
                    <CreateWorkspaceButton />
                </div>

                <WorkspaceList workspaces={workspaces} />
            </div>
        </div>
    )
}