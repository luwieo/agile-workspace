import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from './kanban-board'
import MemberAvatarGroup, { type AvatarMember } from '@/components/member-avatar-group'
import AddTaskButton from './add-task-button'

import SprintTabs from '@/components/sprint-tabs'
import { type WorkspaceRole } from '@/lib/rbac'

export default async function KanbanPage({
    searchParams,
}: {
    searchParams?: Promise<{ workspaceId?: string }> | { workspaceId?: string }
}) {
    const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {}
    const workspaceId = resolvedParams.workspaceId

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Current user profile + active project in parallel
    const [profileResult, projectResult] = await Promise.all([
        (supabase.from('profiles') as any)
            .select('first_name, last_name, username, avatar_url')
            .eq('id', user.id)
            .maybeSingle(),
        (() => {
            // Do NOT include whiteboard_data here — column may not exist yet if migration hasn't run.
            // A missing column causes the entire query to error, making activeProject null.
            let q = (supabase.from('projects') as any).select('id, name, workspace_id')
            if (workspaceId) q = q.eq('workspace_id', workspaceId)
            return q.limit(1)
        })(),
    ])

    const profile = profileResult.data
    const activeProject = projectResult.data?.[0]

    const currentUserName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || user.email || ''
        : user.email || ''

    const effectiveWorkspaceId = activeProject?.workspace_id || workspaceId

    // Fetch tasks + members + workspace in parallel
    const [tasksResult, rawMembersResult, workspaceResult] = await Promise.all([
        activeProject
            ? (supabase.from('tasks') as any)
                .select('*')
                .eq('project_id', activeProject.id)
                .order('created_at', { ascending: true })
            : Promise.resolve({ data: [] }),
        effectiveWorkspaceId
            ? (supabase.from('workspace_members') as any)
                .select(`
                    user_id,
                    role,
                    profiles (
                        id,
                        first_name,
                        last_name,
                        username,
                        email,
                        avatar_url
                    )
                `)
                .eq('workspace_id', effectiveWorkspaceId)
            : Promise.resolve({ data: [] }),
        effectiveWorkspaceId
            ? (supabase.from('workspaces') as any)
                .select('id, name, slug, tags')
                .eq('id', effectiveWorkspaceId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
    ])

    const boardTasks = tasksResult.data || []
    const workspaceTags: string[] = workspaceResult.data?.tags || []

    // Map raw members to AvatarMember[]
    const avatarMembers: AvatarMember[] = (rawMembersResult.data || []).map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        name: m.profiles
            ? `${m.profiles.first_name || ''} ${m.profiles.last_name || ''}`.trim()
                || m.profiles.username
                || m.profiles.email
                || m.user_id
            : m.user_id,
        email: m.profiles?.email || '',
        username: m.profiles?.username || null,
        avatarUrl: m.profiles?.avatar_url || null,
    }))

    // Direct ownership check — more reliable than scanning the members array
    const { data: selfMembership } = effectiveWorkspaceId
        ? await (supabase.from('workspace_members') as any)
            .select('role')
            .eq('workspace_id', effectiveWorkspaceId)
            .eq('user_id', user.id)
            .maybeSingle()
        : { data: null }

    const isOwner = selfMembership?.role === 'owner'

    const currentUser: AvatarMember = {
        userId: user.id,
        name: currentUserName,
        username: profile?.username ?? null,
        role: selfMembership?.role ?? 'member',
        avatarUrl: profile?.avatar_url ?? null,
        email: user.email,
    }

    const backlogHref = `/workspace/backlog${workspaceId ? `?workspaceId=${workspaceId}` : ''}`

    // Fetch whiteboard_data separately so a missing column (migration not yet run)
    // never breaks the main project query / task loading above.
    let whiteboardData: any[] = []
    if (activeProject?.id) {
        try {
            const { data: wbData } = await (supabase.from('projects') as any)
                .select('whiteboard_data')
                .eq('id', activeProject.id)
                .maybeSingle()
            whiteboardData = wbData?.whiteboard_data || []
        } catch {
            // Column doesn't exist yet — silently ignore
        }
    }

    // Settings data — guarded by isOwner only; workspaceResult.data used with fallbacks
    // so a null response (e.g. tags column not yet migrated) doesn't drop the whole object
    const settingsData = isOwner ? {
        workspace: {
            id: workspaceResult.data?.id ?? effectiveWorkspaceId ?? '',
            name: workspaceResult.data?.name ?? '',
            slug: workspaceResult.data?.slug ?? '',
            tags: workspaceTags,
        },
        members: avatarMembers,
        currentUserId: user.id,
    } : undefined

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
            {/* Board Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-800">
                            {activeProject?.name || 'Sprint Board'}
                        </h1>
                        <p className="text-xs text-slate-400">
                            {boardTasks.length} task{boardTasks.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {effectiveWorkspaceId && (
                        <div className="flex items-center gap-2">
                            <MemberAvatarGroup
                                currentUser={currentUser}
                                workspaceId={effectiveWorkspaceId}
                                members={avatarMembers}
                            />
                        </div>
                    )}
                </div>

                {activeProject && selfMembership?.role !== 'viewer' && (
                    <AddTaskButton
                        projectId={activeProject.id}
                        members={avatarMembers}
                        workspaceTags={workspaceTags}
                    />
                )}
            </div>

            {/* Sprint tabs */}
            <SprintTabs
                tasks={boardTasks}
                members={avatarMembers}
                backlogHref={backlogHref}
                isOwner={isOwner}
                settingsData={settingsData}
                projectId={activeProject?.id}
                workspaceId={effectiveWorkspaceId ?? undefined}
                whiteboardData={whiteboardData as unknown as Record<string, unknown> | null}
                currentUser={{ id: user.id, name: currentUserName }}
                userRole={selfMembership?.role as WorkspaceRole | undefined}
                board={
                    <KanbanBoard
                        initialTasks={boardTasks}
                        projectId={activeProject?.id}
                        members={avatarMembers}
                        workspaceTags={workspaceTags}
                        userRole={selfMembership?.role as WorkspaceRole | undefined}
                    />
                }
            />
        </div>
    )
}