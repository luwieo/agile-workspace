'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect, useTransition } from 'react'
import { updateProfile } from '@/app/(dashboard)/workspace/actions'
import { signOut } from '@/app/(auth)/actions'

interface WorkspaceSidebarProps {
    userEmail: string
    workspaceName?: string
    workspaceId?: string
    username?: string | null
    avatarUrl?: string | null
    firstName?: string | null
    middleName?: string | null
    lastName?: string | null
}

export default function WorkspaceSidebar({
    userEmail,
    workspaceName = 'Workspace',
    workspaceId,
    username,
    avatarUrl,
    firstName,
    middleName,
    lastName,
}: WorkspaceSidebarProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentWorkspaceId = searchParams.get('workspaceId') || workspaceId
    const querySuffix = currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ''

    const [profileOpen, setProfileOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const dialogRef = useRef<HTMLDialogElement>(null)

    // Sync dialog open/close with native <dialog>
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (profileOpen) {
            dialog.showModal()
        } else {
            dialog.close()
        }
    }, [profileOpen])

    // Close on Escape (native dialog already does this, but we sync state)
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        const handleClose = () => {
            setProfileOpen(false)
            setSaveError(null)
            setSaveSuccess(false)
        }
        dialog.addEventListener('close', handleClose)
        return () => dialog.removeEventListener('close', handleClose)
    }, [])

    async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaveError(null)
        setSaveSuccess(false)
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                await updateProfile(formData)
                setSaveSuccess(true)
                setTimeout(() => {
                    setProfileOpen(false)
                    setSaveSuccess(false)
                }, 1000)
            } catch (err: any) {
                setSaveError(err?.message || 'Failed to save profile.')
            }
        })
    }

    const navItems = [
        {
            name: 'Overview',
            href: `/workspace${querySuffix}`,
            active: pathname === '/workspace',
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Active Sprint',
            href: `/workspace/kanban${querySuffix}`,
            active: pathname.startsWith('/workspace/kanban'),
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
            ),
        },
        {
            name: 'Backlog',
            href: `/workspace/backlog${querySuffix}`,
            active: pathname.startsWith('/workspace/backlog'),
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
            ),
        },
    ]

    // Avatar: image if URL provided, else initials
    const initials = firstName
        ? `${firstName[0]}${lastName?.[0] || ''}`.toUpperCase()
        : userEmail[0].toUpperCase()

    const displayName = username ? `@${username}` : userEmail

    return (
        <>
            <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] text-slate-300">
                {/* Workspace Header */}
                <div className="flex h-14 items-center gap-3 border-b border-slate-800 px-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 font-bold text-white shadow-sm text-sm">
                        {workspaceName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-semibold text-white">{workspaceName}</span>
                        <span className="text-[11px] text-slate-400">Agile Team</span>
                    </div>
                </div>

                {/* Nav List */}
                <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
                    <div>
                        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Planning
                        </span>
                        <nav className="mt-2 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${item.active
                                        ? 'bg-teal-600/20 text-teal-400'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Profile + Sign Out Footer */}
                <div className="border-t border-slate-800 px-3 py-3 space-y-1">
                    {/* Profile row */}
                    <button
                        type="button"
                        onClick={() => setProfileOpen(true)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-800"
                    >
                        {/* Avatar */}
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-700"
                            />
                        ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white ring-1 ring-slate-700">
                                {initials}
                            </div>
                        )}
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-xs font-semibold text-slate-200">{displayName}</span>
                            <span className="truncate text-[11px] text-slate-500">Edit profile</span>
                        </div>
                    </button>

                    {/* Divider */}
                    <div className="my-1 border-t border-slate-800" />

                    {/* Sign Out */}
                    <form action={signOut}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Edit Profile Dialog */}
            <dialog
                ref={dialogRef}
                className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-800">Edit Profile</h2>
                    <button
                        type="button"
                        onClick={() => setProfileOpen(false)}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4 px-6 py-5">
                    {/* Name row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                                First Name
                            </label>
                            <input
                                name="firstName"
                                required
                                defaultValue={firstName || ''}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                                Middle
                            </label>
                            <input
                                name="middleName"
                                defaultValue={middleName || ''}
                                placeholder="Optional"
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                                Last Name
                            </label>
                            <input
                                name="lastName"
                                required
                                defaultValue={lastName || ''}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Username
                        </label>
                        <div className="relative mt-1.5">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">@</span>
                            <input
                                name="username"
                                required
                                defaultValue={username || ''}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Avatar URL
                        </label>
                        <input
                            name="avatarUrl"
                            type="url"
                            defaultValue={avatarUrl || ''}
                            placeholder="https://example.com/avatar.png"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {/* Email — read-only */}
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Email
                        </label>
                        <input
                            value={userEmail}
                            readOnly
                            className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-100 px-3 py-2 text-sm text-slate-400 outline-none"
                        />
                    </div>

                    {saveError && (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {saveError}
                        </p>
                    )}
                    {saveSuccess && (
                        <p className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
                            Profile saved ✓
                        </p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setProfileOpen(false)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#0d9488] disabled:opacity-50"
                        >
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    )
}