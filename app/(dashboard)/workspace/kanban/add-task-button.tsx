'use client'

import { useState, useRef, useTransition } from 'react'
import { createTask } from '../actions'
import { type AvatarMember } from '@/components/member-avatar-group'

const TODAY = new Date().toISOString().split('T')[0]

export default function AddTaskButton({
    projectId,
    members,
}: {
    projectId: string
    members: AvatarMember[]
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

    function openModal() {
        setError(null)
        setOpen(true)
        dialogRef.current?.showModal()
    }

    function closeModal() {
        setOpen(false)
        dialogRef.current?.close()
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                await createTask(formData)
                formRef.current?.reset()
                closeModal()
            } catch (err: any) {
                setError(err?.message || 'Failed to create task.')
            }
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Task
            </button>

            <dialog
                ref={dialogRef}
                onClose={closeModal}
                className="fixed inset-0 m-auto w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-800">New Task</h2>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                    <input type="hidden" name="projectId" value={projectId} />

                    {/* Task Name */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Task Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            name="title"
                            required
                            placeholder="What needs to be done?"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {/* Assignee */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Assignee
                        </label>
                        <select
                            name="assigneeId"
                            defaultValue=""
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                    {m.username ? `@${m.username}` : m.name} {m.role ? `(${m.role})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Priority
                        </label>
                        <select
                            name="priority"
                            defaultValue="medium"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Deadline
                        </label>
                        <input
                            name="dueDate"
                            type="date"
                            min={TODAY}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Tags <span className="font-normal normal-case text-slate-400">(comma-separated, optional)</span>
                        </label>
                        <input
                            name="tags"
                            placeholder="e.g. Frontend, Bug, Design"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Description <span className="font-normal normal-case text-slate-400">(optional)</span>
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Add details, acceptance criteria, or context..."
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {error && (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl bg-[#1e3a5f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488] disabled:opacity-50"
                        >
                            {isPending ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    )
}
