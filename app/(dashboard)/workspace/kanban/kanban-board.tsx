'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useTransition, useEffect } from 'react'
import { updateTaskStatus, updateTask, deleteTask } from '../actions'
import { TagChipSelector } from './add-task-button'
import { canEditTasks, canDeleteTasks, type WorkspaceRole } from '@/lib/rbac'

const TAG_COLORS: Record<string, string> = {
    bug: 'bg-red-50 text-red-700 border-red-200',
    frontend: 'bg-blue-50 text-blue-700 border-blue-200',
    backend: 'bg-purple-50 text-purple-700 border-purple-200',
    design: 'bg-pink-50 text-pink-700 border-pink-200',
    feature: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function getTagStyle(tag: string) {
    const normalized = tag.toLowerCase().trim()
    return (
        TAG_COLORS[normalized] ||
        'bg-slate-100 text-slate-700 border-slate-200'
    )
}

export type Member = {
    userId: string
    name: string
    role?: string
}

export type Task = {
    id: string
    title: string
    description?: string | null
    status: 'backlog' | 'todo' | 'in_progress' | 'done'
    priority?: 'low' | 'medium' | 'high' | null
    assignee_id?: string | null
    tags?: string[] | null
    project_id?: string
    due_date?: string | null
}

const COLUMNS: { id: Task['status']; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
]

export default function KanbanBoard({
    initialTasks,
    projectId,
    members = [],
    workspaceTags = [],
    userRole,
}: {
    initialTasks: Task[]
    projectId?: string
    members?: Member[]
    workspaceTags?: string[]
    userRole?: WorkspaceRole | null
}) {
    const canEdit = canEditTasks(userRole)
    const canDelete = canDeleteTasks(userRole)
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isPending, startTransition] = useTransition()
    const [selectedEditTags, setSelectedEditTags] = useState<string[]>([])

    // Filter state
    const [search, setSearch] = useState('')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [tagFilter, setTagFilter] = useState<string>('all')

    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    // Sync edit tags when a task is selected
    useEffect(() => {
        setSelectedEditTags(selectedTask?.tags || [])
    }, [selectedTask?.id])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedTask(null)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Subscribe to live Postgres changes on the tasks table
    useEffect(() => {
        const supabase = createClient()

        // 1. Shared channel name across all clients
        const channel = supabase
            .channel('tasks-shared-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                },
                (payload) => {
                    console.log('Realtime event received! Payload:', payload)

                    if (payload.eventType === 'INSERT') {
                        const newTask = payload.new as Task
                        // Only add if it belongs to this board's project
                        if (!projectId || newTask.project_id === projectId) {
                            setTasks((prev) => {
                                if (prev.some((t) => t.id === newTask.id)) return prev
                                return [...prev, newTask]
                            })
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedTask = payload.new as Task
                        setTasks((prev) =>
                            prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
                        )
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as { id?: string })?.id
                        if (deletedId) {
                            setTasks((prev) => prev.filter((t) => t.id !== deletedId))
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('Realtime status on tasks-shared-channel:', status)
                if (err) console.error('Subscription error:', err)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId])

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        setActiveTaskId(taskId)
        e.dataTransfer.setData('text/plain', taskId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverColumn !== columnId) setDragOverColumn(columnId)
    }

    const handleDragLeave = () => setDragOverColumn(null)

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
        e.preventDefault()
        setDragOverColumn(null)
        const taskId = e.dataTransfer.getData('text/plain') || activeTaskId

        if (!taskId) return

        const draggedTask = tasks.find((t) => t.id === taskId)
        if (!draggedTask || draggedTask.status === targetStatus) {
            setActiveTaskId(null)
            return
        }

        const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            if (!selectedTask) return

            const formData = new FormData(e.currentTarget)
            const updatedTitle = formData.get('title') as string
            const updatedDesc = formData.get('description') as string
            const updatedPriority = formData.get('priority') as Task['priority']
            const updatedAssignee = formData.get('assigneeId') as string
            const tagsRaw = (formData.get('tags') as string) || ''
            const updatedTags = tagsRaw
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)

            const previousTasks = [...tasks]
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === selectedTask.id
                        ? {
                            ...t,
                            title: updatedTitle,
                            description: updatedDesc,
                            priority: updatedPriority,
                            assignee_id: updatedAssignee === 'unassigned' ? null : updatedAssignee,
                            tags: updatedTags,
                        }
                        : t
                )
            )

            const currentTask = selectedTask
            setSelectedTask(null)

            startTransition(async () => {
                try {
                    await updateTask(formData)
                } catch (err) {
                    console.error('Failed to update task:', err)
                    setTasks(previousTasks)
                    setSelectedTask(currentTask)
                }
            })
        }

        const previousTasks = [...tasks]
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
        )
        setActiveTaskId(null)

        startTransition(async () => {
            try {
                await updateTaskStatus(taskId, targetStatus)
            } catch (err) {
                console.error('Failed to update status:', err)
                setTasks(previousTasks)
            }
        })
    }

    const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedTask) return

        const formData = new FormData(e.currentTarget)
        const updatedTitle = formData.get('title') as string
        const updatedDesc = formData.get('description') as string
        const updatedPriority = formData.get('priority') as Task['priority']
        const updatedAssignee = formData.get('assigneeId') as string
        const updatedDueDate = (formData.get('dueDate') as string) || null
        // Inject chip-selected tags
        formData.set('tags', selectedEditTags.join(','))

        const previousTasks = [...tasks]
        setTasks((prev) =>
            prev.map((t) =>
                t.id === selectedTask.id
                    ? {
                        ...t,
                        title: updatedTitle,
                        description: updatedDesc,
                        priority: updatedPriority,
                        assignee_id: updatedAssignee === 'unassigned' ? null : updatedAssignee,
                        due_date: updatedDueDate,
                        tags: selectedEditTags,
                    }
                    : t
            )
        )

        const currentTask = selectedTask
        setSelectedTask(null)

        startTransition(async () => {
            try {
                await updateTask(formData)
            } catch (err) {
                console.error('Failed to update task:', err)
                setTasks(previousTasks)
                setSelectedTask(currentTask)
            }
        })
    }

    const handleDeleteTask = async () => {
        if (!selectedTask) return
        if (!confirm('Are you sure you want to delete this task?')) return

        const previousTasks = [...tasks]
        const taskIdToDelete = selectedTask.id
        setTasks((prev) => prev.filter((t) => t.id !== taskIdToDelete))
        setSelectedTask(null)

        startTransition(async () => {
            try {
                await deleteTask(taskIdToDelete)
            } catch (err) {
                console.error('Failed to delete task:', err)
                setTasks(previousTasks)
            }
        })
    }

    return (
        <>
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-8 py-3">
                {/* Search */}
                <div className="relative">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-44 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                </div>

                {/* Priority filter chips */}
                <div className="flex items-center gap-1">
                    {(['all', 'low', 'medium', 'high'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                                priorityFilter === p
                                    ? p === 'high' ? 'bg-red-500 text-white'
                                        : p === 'medium' ? 'bg-amber-400 text-white'
                                        : p === 'low' ? 'bg-slate-400 text-white'
                                        : 'bg-[#1e3a5f] text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {p === 'all' ? 'All Priorities' : p}
                        </button>
                    ))}
                </div>

                {/* Tag filter */}
                {(() => {
                    const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || []))).sort()
                    if (allTags.length === 0) return null
                    return (
                        <select
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 outline-none transition focus:border-teal-500"
                        >
                            <option value="all">All Tags</option>
                            {allTags.map((tag) => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    )
                })()}

                {/* Clear filters */}
                {(search || priorityFilter !== 'all' || tagFilter !== 'all') && (
                    <button
                        onClick={() => { setSearch(''); setPriorityFilter('all'); setTagFilter('all') }}
                        className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:text-slate-600"
                    >
                        Clear filters ×
                    </button>
                )}
            </div>

            <div className="flex flex-1 gap-6 overflow-x-auto p-8">
                {COLUMNS.map((column) => {
                    const columnTasks = tasks
                        .filter((t) => t.status === column.id)
                        .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
                        .filter((t) => priorityFilter === 'all' || t.priority === priorityFilter)
                        .filter((t) => tagFilter === 'all' || (t.tags || []).includes(tagFilter))
                    const isTarget = canEdit && dragOverColumn === column.id

                    return (
                        <div
                            key={column.id}
                            onDragOver={canEdit ? (e) => handleDragOver(e, column.id) : undefined}
                            onDragLeave={canEdit ? handleDragLeave : undefined}
                            onDrop={canEdit ? (e) => handleDrop(e, column.id) : undefined}
                            className={`flex h-full w-80 shrink-0 flex-col rounded-2xl p-4 transition-colors duration-200 ${isTarget
                                ? 'bg-teal-50/70 ring-2 ring-teal-400 ring-dashed'
                                : 'bg-slate-100/50'
                                }`}
                        >
                            <div className="mb-4 flex items-center justify-between px-2">
                                <h2 className="font-semibold text-slate-700">{column.label}</h2>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                                    {columnTasks.length}
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                                {columnTasks.map((task) => {
                                    const isDragging = activeTaskId === task.id
                                    const assignee = members.find((m) => m.userId === task.assignee_id)

                                    return (
                                        <div
                                            key={task.id}
                                            draggable={canEdit}
                                            onDragStart={canEdit ? (e) => handleDragStart(e, task.id) : undefined}
                                            onClick={() => setSelectedTask(task)}
                                            className={`group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-500 hover:shadow-md ${
                                                canEdit ? 'cursor-pointer' : 'cursor-default'
                                            } ${isDragging ? 'opacity-40 ring-2 ring-teal-400' : 'opacity-100'}`}
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

                                                {assignee && (
                                                    <div
                                                        title={`Assigned to ${assignee.name}`}
                                                        className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-800 ring-1 ring-white"
                                                    >
                                                        {assignee.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-sm font-medium text-slate-800">{task.title}</h3>

                                            {task.description && (
                                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Due date badge */}
                                            {task.due_date && (() => {
                                                const today = new Date().toISOString().split('T')[0]
                                                const overdue = task.due_date < today
                                                return (
                                                    <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${
                                                        overdue ? 'text-red-600' : 'text-slate-500'
                                                    }`}>
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {overdue ? 'Overdue · ' : ''}{task.due_date}
                                                    </div>
                                                )
                                            })()}

                                            {task.tags && task.tags.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {task.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${getTagStyle(tag)}`}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {columnTasks.length === 0 && (
                                    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                                        Drop tasks here
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedTask && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        onClick={() => setSelectedTask(null)}
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
                    />

                    <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Task Details
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedTask(null)}
                                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveTask} className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
                            <input type="hidden" name="taskId" value={selectedTask.id} />

                            {/* Viewer banner */}
                            {!canEdit && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View only — Viewers cannot edit tasks
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Title</label>
                                    <input
                                        name="title"
                                        required
                                        readOnly={!canEdit}
                                        defaultValue={selectedTask.title}
                                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-sm font-medium text-slate-800 outline-none transition ${
                                            canEdit
                                                ? 'border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                                                : 'border-transparent bg-slate-50 text-slate-500'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Assignee</label>
                                    <select
                                        name="assigneeId"
                                        disabled={!canEdit}
                                        defaultValue={selectedTask.assignee_id || 'unassigned'}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="unassigned">Unassigned</option>
                                        {members.map((m) => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.name} ({m.role || 'member'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Priority</label>
                                    <select
                                        name="priority"
                                        disabled={!canEdit}
                                        defaultValue={selectedTask.priority || 'medium'}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Deadline</label>
                                    <input
                                        name="dueDate"
                                        type="date"
                                        readOnly={!canEdit}
                                        min={new Date().toISOString().split('T')[0]}
                                        defaultValue={selectedTask.due_date || ''}
                                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-700 outline-none transition ${
                                            canEdit
                                                ? 'border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                                                : 'border-transparent bg-slate-50 text-slate-400'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Tags</label>
                                    <div className="mt-1.5">
                                        {canEdit ? (
                                            <TagChipSelector
                                                workspaceTags={workspaceTags}
                                                selected={selectedEditTags}
                                                onChange={setSelectedEditTags}
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {(selectedTask.tags || []).length === 0
                                                    ? <span className="text-xs text-slate-400">No tags</span>
                                                    : (selectedTask.tags || []).map((tag) => (
                                                        <span key={tag} className="rounded-xl border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">{tag}</span>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Description</label>
                                    <textarea
                                        name="description"
                                        rows={5}
                                        readOnly={!canEdit}
                                        defaultValue={selectedTask.description || ''}
                                        placeholder={canEdit ? 'Add details, criteria, or context...' : ''}
                                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-sm text-slate-800 outline-none transition ${
                                            canEdit
                                                ? 'border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                                                : 'border-transparent bg-slate-50 text-slate-400 resize-none'
                                        }`}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
                                {/* Delete — owner/developer only */}
                                {canDelete ? (
                                    <button
                                        type="button"
                                        onClick={handleDeleteTask}
                                        className="rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                        Delete Task
                                    </button>
                                ) : (
                                    <div />
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTask(null)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        {canEdit ? 'Cancel' : 'Close'}
                                    </button>
                                    {canEdit && (
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d9488] disabled:opacity-50"
                                        >
                                            Save Changes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </aside>
                </div>
            )}
        </>
    )
}