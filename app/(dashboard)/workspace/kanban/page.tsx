import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTask } from '../actions'

const COLUMNS = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
]

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

    // Find active project (filter by workspaceId if provided)
    let projectQuery = (supabase.from('projects') as any).select('id, name')
    if (workspaceId) {
        projectQuery = projectQuery.eq('workspace_id', workspaceId)
    }
    const { data: projects } = await projectQuery.limit(1)

    const activeProject = projects?.[0]

    // Query tasks belonging to this project
    const { data: tasks } = activeProject
        ? await (supabase.from('tasks') as any).select('*').eq('project_id', activeProject.id)
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

            {/* Kanban Columns */}
            <div className="flex flex-1 gap-6 overflow-x-auto p-8">
                {COLUMNS.map((column) => {
                    const columnTasks = boardTasks.filter((t: any) => t.status === column.id)

                    return (
                        <div key={column.id} className="flex h-full w-80 shrink-0 flex-col rounded-2xl bg-slate-100/50 p-4">
                            <div className="mb-4 flex items-center justify-between px-2">
                                <h2 className="font-semibold text-slate-700">{column.label}</h2>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                                    {columnTasks.length}
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                                {columnTasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="group cursor-grab rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:cursor-grabbing hover:border-teal-500 hover:shadow-md"
                                    >
                                        <div className="mb-2 flex items-start justify-between">
                                            <span
                                                className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${task.priority === 'high'
                                                    ? 'bg-red-50 text-red-600'
                                                    : task.priority === 'medium'
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                {task.priority || 'no priority'}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-medium text-slate-800">{task.title}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}