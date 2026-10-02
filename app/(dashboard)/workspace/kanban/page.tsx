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

    // Find active project
    let projectQuery = (supabase.from('projects') as any).select('id, name, workspace_id')
    if (workspaceId) {
        projectQuery = projectQuery.eq('workspace_id', workspaceId)
    }
    const { data: projects } = await projectQuery.limit(1)
    const activeProject = projects?.[0]

    // Query tasks belonging to this project (all statuses for summary tab)
    const { data: tasks } = activeProject
        ? await (supabase.from('tasks') as any)
            .select('*')
            .eq('project_id', activeProject.id)
            .order('created_at', { ascending: true })
        : { data: [] }

    // Fetch workspace members
    const effectiveWorkspaceId = activeProject?.workspace_id || workspaceId
    const members: AvatarMember[] = effectiveWorkspaceId ? await getWorkspaceMembers(effectiveWorkspaceId) : []

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

                    {/* Team member avatar group */}
                    <MemberAvatarGroup members={members} />
                </div>

                {/* Add Task modal trigger */}
                {activeProject && (
                    <AddTaskButton projectId={activeProject.id} members={members} />
                )}
            </div>

            {/* Sprint tabs — Summary | Board | Backlog | Timeline */}
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