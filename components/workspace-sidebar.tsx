'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect, useTransition } from 'react'
import { updateProfile } from '@/app/(dashboard)/workspace/actions'
import { signOut } from '@/app/(auth)/actions'
import { 
    LayoutDashboard, 
    KanbanSquare, 
    LogOut, 
    PanelLeftClose, 
    PanelLeftOpen, 
    Settings, 
    User,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

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
    const [isCollapsed, setIsCollapsed] = useState(false)
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
            icon: LayoutDashboard,
        },
        {
            name: 'Active Sprint',
            href: `/workspace/kanban${querySuffix}`,
            active: pathname.startsWith('/workspace/kanban'),
            icon: KanbanSquare,
        },
    ]

    // Avatar: image if URL provided, else initials
    const initials = firstName
        ? `${firstName[0]}${lastName?.[0] || ''}`.toUpperCase()
        : userEmail[0].toUpperCase()

    const displayName = username ? `@${username}` : userEmail

    return (
        <>
            <aside className={`relative flex h-screen shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] text-slate-300 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                
                {/* Collapsing toggle button overlapping the right edge */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-16 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-[#0f172a] text-slate-400 hover:bg-slate-800 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-md"
                >
                    {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
                </button>

                {/* Workspace Header */}
                <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500 font-bold text-white shadow-md text-sm transition-transform hover:scale-105">
                            {workspaceName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className={`flex flex-col truncate transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                            <span className="truncate text-sm font-semibold text-white">{workspaceName}</span>
                            <span className="text-[11px] text-slate-400">Agile Team</span>
                        </div>
                    </div>
                </div>

                {/* Nav List */}
                <div className="flex-1 space-y-6 overflow-hidden px-3 py-4">
                    <div>
                        {!isCollapsed && (
                            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-opacity duration-300">
                                Planning
                            </span>
                        )}
                        <nav className={`space-y-1 ${!isCollapsed ? 'mt-2' : 'mt-0'}`}>
                            {navItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <div key={item.name} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                                                item.active
                                                    ? 'bg-teal-600/20 text-teal-400'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                            } ${isCollapsed ? 'justify-center' : ''}`}
                                        >
                                            <Icon size={20} className="shrink-0" />
                                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                                        </Link>
                                        
                                        {/* Tooltip for collapsed state */}
                                        {isCollapsed && (
                                            <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                                                {item.name}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </nav>
                    </div>
                </div>

                {/* Profile + Sign Out Footer */}
                <div className="border-t border-slate-800 px-3 py-3 space-y-1">
                    {/* Profile row */}
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => setProfileOpen(true)}
                            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-all duration-200 hover:bg-slate-800 active:scale-[0.98] ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {/* Avatar */}
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-700 hover:ring-slate-500 transition-all"
                                />
                            ) : (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white ring-1 ring-slate-700 hover:ring-slate-500 transition-all">
                                    {initials}
                                </div>
                            )}
                            
                            {!isCollapsed && (
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-xs font-semibold text-slate-200">{displayName}</span>
                                    <span className="truncate text-[11px] text-slate-500">Edit profile</span>
                                </div>
                            )}
                        </button>
                        
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                                Edit Profile
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="my-1 border-t border-slate-800" />

                    {/* Sign Out */}
                    <div className="relative group">
                        <form action={signOut}>
                            <button
                                type="submit"
                                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-red-400 active:scale-[0.98] ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <LogOut size={18} className="shrink-0" />
                                {!isCollapsed && <span>Sign Out</span>}
                            </button>
                        </form>
                        
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                                Sign Out
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Edit Profile Dialog */}
            <dialog
                ref={dialogRef}
                className="fixed inset-0 m-auto w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm transition-all"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-800">Edit Profile</h2>
                    <button
                        type="button"
                        onClick={() => setProfileOpen(false)}
                        className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95"
                    >
                        <User size={20} />
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
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 hover:border-slate-300"
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
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 hover:border-slate-300"
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
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 hover:border-slate-300"
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
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 hover:border-slate-300"
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
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 hover:border-slate-300"
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
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[#1e3a5f]/30 transition-all hover:bg-[#0d9488] active:scale-95 disabled:opacity-50 hover:shadow-[#0d9488]/40"
                        >
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    )
}