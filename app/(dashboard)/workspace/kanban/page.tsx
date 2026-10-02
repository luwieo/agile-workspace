import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTask } from '../actions'
import KanbanBoard from './kanban-board'

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
    let projectQuery = (supabase.from('projects') as any).select('id, name')
    if (workspaceId) {
        projectQuery = projectQuery.eq('workspace_id', workspaceId)
    }
    const { data: projects } = await projectQuery.limit(1)
    const activeProject = projects?.[0]

    // Query tasks belonging to this project
    const { data: tasks } = activeProject
        ? await (supabase.from('tasks') as any)
            .select('*')
            .eq('project_id', activeProject.id)
            .order('created_at', { ascending: true })
        : { data: [] }

    const boardTasks = tasks || []

    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-slate-50">
            {/* Board Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/workspace" className="text-slate-400 transition hover:text-slate-600">
                        ← Back
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                            {activeProject?.name || 'Sprint Board'}
                        </h1>
                        <p className="text-sm text-slate-500">{boardTasks.length} Active Tasks</p>
                    </div>
                </div>

                {/* Quick Add Task Form */}
                {activeProject && (
                    <form action={createTask} className="flex items-center gap-2">
                        <input type="hidden" name="projectId" value={activeProject.id} />
                        <input
                            name="title"
                            required
                            placeholder="New task title..."
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                        />
                        <select
                            name="priority"
                            defaultValue="medium"
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 outline-none focus:border-teal-500"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <button
                            type="submit"
                            className="rounded-xl bg-[#1e3a5f] px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0d9488]"
                        >
                            + Add
                        </button>
                    </form>
                )}
            </div>

            {/* Interactive Kanban Board */}
            <KanbanBoard initialTasks={boardTasks} />
        </div>
    )
}