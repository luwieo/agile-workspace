'use client'

import { useState, useRef, useTransition } from 'react'
import { addWorkspaceMember } from '@/app/(dashboard)/workspace/actions'

export default function AddMemberButton({
    workspaceId,
}: {
    workspaceId: string
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

    function openModal() {
        setError(null)
        setSuccess(false)
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
        setSuccess(false)

        const formData = new FormData(e.currentTarget)
        formData.set('workspaceId', workspaceId)

        startTransition(async () => {
            try {
                await addWorkspaceMember(formData)
                setSuccess(true)
                formRef.current?.reset()
                setTimeout(() => {
                    closeModal()
                }, 1200)
            } catch (err: any) {
                setError(err?.message || 'Failed to add member.')
            }
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
                <svg className="h-3.5 w-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Add Member</span>
            </button>

            <dialog
                ref={dialogRef}
                onClose={closeModal}
                className="fixed inset-0 m-auto w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">Add Workspace Member</h2>
                        <p className="text-xs text-slate-400">Instantly grant a registered user access to this workspace.</p>
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
                            User Email <span className="text-red-400">*</span>
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="teammate@company.com"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                            The user must have an existing AgileSpace account.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Role <span className="text-red-400">*</span>
                        </label>
                        <select
                            name="role"
                            defaultValue="member"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="developer">Developer — Full access to tasks & whiteboard</option>
                            <option value="member">Member — Can create/edit tasks & whiteboard</option>
                            <option value="viewer">Viewer — Read-only access</option>
                        </select>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-medium text-teal-700">
                            ✓ Member added successfully!
                        </div>
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
                            disabled={isPending || success}
                            className="rounded-xl bg-[#1e3a5f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488] disabled:opacity-50"
                        >
                            {isPending ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    )
}
