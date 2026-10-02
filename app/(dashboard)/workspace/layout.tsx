import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkspaceSidebar from '@/components/workspace-sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Query the user's active workspace
    const { data: memberships } = await (supabase
        .from('workspace_members') as any)
        .select('workspace_id, workspaces(id, name)')
        .eq('user_id', user.id)
        .limit(1)

    const activeWorkspace = memberships?.[0]?.workspaces

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            <WorkspaceSidebar
                userEmail={user.email || ''}
                workspaceName={activeWorkspace?.name}
                workspaceId={activeWorkspace?.id}
            />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}