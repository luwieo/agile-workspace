'use client'

import { useState, useRef, useTransition } from 'react'
import { createWorkspace } from '@/app/(dashboard)/workspace/actions'

export default function CreateWorkspaceButton({ variant = 'default' }: { variant?: 'default' | 'empty-state' }) {
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
                await createWorkspace(formData)
                formRef.current?.reset()
                closeModal()
            } catch (err: any) {
                setError(err?.message || 'Failed to create workspace.')
            }
        })
    }

    const buttonClass = variant === 'empty-state'
        ? "rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#1e3a5f]/30 transition-all duration-200 hover:bg-[#0d9488] hover:-translate-y-0.5 active:scale-95 hover:shadow-[#0d9488]/40"
        : "rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1e3a5f]/30 transition-all duration-200 hover:bg-[#0d9488] hover:-translate-y-0.5 active:scale-95 hover:shadow-[#0d9488]/40"

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className={buttonClass}
            >
                {variant === 'empty-state' ? 'Create Workspace' : '+ Add Workspace'}
            </button>

            <dialog
                ref={dialogRef}
                onClose={closeModal}
                className="fixed inset-0 m-auto w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">Create Workspace</h2>
                        <p className="text-xs text-slate-400">Set up a new space for your team.</p>
                    </div>
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
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Workspace Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. AgileSpace Team"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl bg-[#1e3a5f] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#1e3a5f]/30 transition-all duration-200 hover:bg-[#0d9488] hover:-translate-y-0.5 active:scale-95 hover:shadow-[#0d9488]/40 disabled:opacity-50"
                        >
                            {isPending ? 'Creating...' : 'Create Workspace'}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    )
}
