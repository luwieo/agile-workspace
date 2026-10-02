'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface WorkspaceSidebarProps {
    userEmail: string
    workspaceName?: string
    workspaceId?: string
}

export default function WorkspaceSidebar({
    userEmail,
    workspaceName = 'Workspace',
    workspaceId,
}: WorkspaceSidebarProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentWorkspaceId = searchParams.get('workspaceId') || workspaceId

    const querySuffix = currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ''

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

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-[#0f172a] text-slate-300">
            {/* Workspace Header */}
            <div className="flex h-14 items-center gap-3 border-b border-slate-800 px-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 font-bold text-white shadow-sm">
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

            {/* User Footer */}
            <div className="border-t border-slate-800 p-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
                            {userEmail.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate text-xs text-slate-300" title={userEmail}>
                            {userEmail}
                        </span>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            title="Sign Out"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    )
}