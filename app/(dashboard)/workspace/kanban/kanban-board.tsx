'use client'

import { useState, useTransition } from 'react'
import { updateTaskStatus } from '../actions'

export type Task = {
    id: string
    title: string
    status: 'backlog' | 'todo' | 'in_progress' | 'done'
    priority?: 'low' | 'medium' | 'high' | null
    tags?: string[] | null
    project_id?: string
}

const COLUMNS: { id: Task['status']; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
]

export default function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [, startTransition] = useTransition()

    // 1. Drag Start: Mark which task is being dragged
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        setActiveTaskId(taskId)
        e.dataTransfer.setData('text/plain', taskId)
        e.dataTransfer.effectAllowed = 'move'
    }

    // 2. Drag Over Column: Allow dropping
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverColumn !== columnId) {
            setDragOverColumn(columnId)
        }
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    // 3. Drop: Optimistically update UI immediately, then trigger server action
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

        // Optimistic state update
        const previousTasks = [...tasks]
        setTasks((prev) =>
            prev.map((task) =>
                task.id === taskId ? { ...task, status: targetStatus } : task
            )
        )
        setActiveTaskId(null)

        // Sync to Supabase via server action
        startTransition(async () => {
            try {
                await updateTaskStatus(taskId, targetStatus)
            } catch (err) {
                console.error('Failed to update task status:', err)
                // Rollback on failure
                setTasks(previousTasks)
            }
        })
    }

    return (
        <div className="flex flex-1 gap-6 overflow-x-auto p-8">
            {COLUMNS.map((column) => {
                const columnTasks = tasks.filter((t) => t.status === column.id)
                const isTarget = dragOverColumn === column.id

                return (
                    <div
                        key={column.id}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                        className={`flex h-full w-80 shrink-0 flex-col rounded-2xl p-4 transition-colors duration-200 ${isTarget
                                ? 'bg-teal-50/70 ring-2 ring-teal-400 ring-dashed'
                                : 'bg-slate-100/50'
                            }`}
                    >
                        {/* Column Header */}
                        <div className="mb-4 flex items-center justify-between px-2">
                            <h2 className="font-semibold text-slate-700">{column.label}</h2>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                                {columnTasks.length}
                            </span>
                        </div>

                        {/* Task Card List */}
                        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                            {columnTasks.map((task) => {
                                const isDragging = activeTaskId === task.id

                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        className={`group cursor-grab rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:cursor-grabbing hover:border-teal-500 hover:shadow-md ${isDragging ? 'opacity-40 ring-2 ring-teal-400' : 'opacity-100'
                                            }`}
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

                                        {task.tags && task.tags.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {task.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700"
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
    )
}