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

    // Query the user's active workspace + profile in parallel
    const [membershipResult, profileResult] = await Promise.all([
        (supabase
            .from('workspace_members') as any)
            .select('workspace_id, workspaces(id, name)')
            .eq('user_id', user.id)
            .limit(1),
        (supabase
            .from('profiles') as any)
            .select('first_name, middle_name, last_name, username, avatar_url')
            .eq('id', user.id)
            .maybeSingle(),
    ])

    const activeWorkspace = membershipResult.data?.[0]?.workspaces
    const profile = profileResult.data

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            <WorkspaceSidebar
                userEmail={user.email || ''}
                workspaceName={activeWorkspace?.name}
                workspaceId={activeWorkspace?.id}
                username={profile?.username || null}
                avatarUrl={profile?.avatar_url || null}
                firstName={profile?.first_name || null}
                middleName={profile?.middle_name || null}
                lastName={profile?.last_name || null}
            />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}