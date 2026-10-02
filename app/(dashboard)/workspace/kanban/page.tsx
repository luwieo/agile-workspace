import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWorkspaceMembers } from '../actions'
import KanbanBoard from './kanban-board'
import MemberAvatarGroup, { type AvatarMember } from '@/components/member-avatar-group'
import AddTaskButton from './add-task-button'
import SprintTabs from '@/components/sprint-tabs'

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

    // Option A: re-query current user's profile for presence tracking
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('first_name, last_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

    const currentUserName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || user.email || ''
        : user.email || ''

    // Find active project
    let projectQuery = (supabase.from('projects') as any).select('id, name, workspace_id')
    if (workspaceId) {
        projectQuery = projectQuery.eq('workspace_id', workspaceId)
    }
    const { data: projects } = await projectQuery.limit(1)
    const activeProject = projects?.[0]

    // Query tasks
    const { data: tasks } = activeProject
        ? await (supabase.from('tasks') as any)
            .select('*')
            .eq('project_id', activeProject.id)
            .order('created_at', { ascending: true })
        : { data: [] }

    // Fetch workspace members (used as role/avatar fallback in presence)
    const effectiveWorkspaceId = activeProject?.workspace_id || workspaceId
    const members: AvatarMember[] = effectiveWorkspaceId ? await getWorkspaceMembers(effectiveWorkspaceId) : []

    // Build currentUser presence payload — find role from members list
    const selfMember = members.find((m) => m.userId === user.id)
    const currentUser: AvatarMember = {
        userId: user.id,
        name: currentUserName,
        username: profile?.username ?? null,
        role: selfMember?.role ?? 'member',
        avatarUrl: profile?.avatar_url ?? null,
        email: user.email,
    }

    const boardTasks = tasks || []
    const backlogHref = `/workspace/backlog${workspaceId ? `?workspaceId=${workspaceId}` : ''}`

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

                    {/* Live presence avatar group — scoped to this workspace */}
                    {effectiveWorkspaceId && (
                        <MemberAvatarGroup
                            currentUser={currentUser}
                            workspaceId={effectiveWorkspaceId}
                            members={members}
                        />
                    )}
                </div>

                {activeProject && (
                    <AddTaskButton projectId={activeProject.id} members={members} />
                )}
            </div>

            {/* Sprint tabs */}
            <SprintTabs
                tasks={boardTasks}
                backlogHref={backlogHref}
                board={
                    <KanbanBoard
                        initialTasks={boardTasks}
                        projectId={activeProject?.id}
                        members={members}
                    />
                }
            />
        </div>
    )
}