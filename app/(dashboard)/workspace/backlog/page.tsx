import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTask, updateTaskStatus } from '../actions'

export default async function BacklogPage({
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

    // Query ONLY backlog tasks
    const { data: backlogTasks } = activeProject
        ? await (supabase.from('tasks') as any)
            .select('*')
            .eq('project_id', activeProject.id)
            .eq('status', 'backlog')
            .order('created_at', { ascending: false })
        : { data: [] }

    const tasks = backlogTasks || []

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 p-8">
            <div className="mx-auto w-full max-w-4xl space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-4">
                        <Link href="/workspace" className="text-slate-400 transition hover:text-slate-600">
                            ← Back
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                Project Backlog
                            </h1>
                            <p className="text-sm text-slate-500">{tasks.length} Unscheduled Items</p>
                        </div>
                    </div>

                    <Link
                        href={`/workspace/kanban${workspaceId ? `?workspaceId=${workspaceId}` : ''}`}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Go to Active Sprint
                    </Link>
                </div>

                {/* Quick Add Form */}
                {activeProject && (
                    <form action={createTask} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <input type="hidden" name="projectId" value={activeProject.id} />
                        <input type="hidden" name="status" value="backlog" />

                        <input
                            name="title"
                            required
                            placeholder="What needs to be done eventually?"
                            className="flex-1 bg-transparent px-2 text-sm text-slate-800 outline-none"
                        />
                        <select
                            name="priority"
                            defaultValue="low"
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 outline-none"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <button
                            type="submit"
                            className="rounded-xl bg-[#1e3a5f] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0d9488]"
                        >
                            Add to Backlog
                        </button>
                    </form>
                )}

                {/* Backlog List */}
                <div className="flex flex-col gap-3">
                    {tasks.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                            Your backlog is empty.
                        </div>
                    ) : (
                        tasks.map((task: any) => (
                            <div key={task.id} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                                task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {task.priority || 'no priority'}
                                        </span>
                                        <h3 className="text-sm font-medium text-slate-800">{task.title}</h3>
                                    </div>
                                </div>

                                {/* Send to Sprint Action */}
                                <form action={async () => {
                                    'use server'
                                    await updateTaskStatus(task.id, 'todo')
                                }}>
                                    <button type="submit" className="opacity-0 transition-opacity group-hover:opacity-100 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100">
                                        Send to Sprint →
                                    </button>
                                </form>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    )
}