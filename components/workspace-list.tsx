'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

type Workspace = {
    id: string
    name: string
    slug: string
    role?: string
    owner_id?: string
    isOwned: boolean
}

const FILTER_TABS = ['All', 'Owned', 'Shared with me'] as const
type FilterTab = typeof FILTER_TABS[number]

export default function WorkspaceList({
    workspaces,
}: {
    workspaces: Workspace[]
}) {
    const [activeFilter, setActiveFilter] = useState<FilterTab>('All')
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        let list = workspaces
        if (activeFilter === 'Owned') list = list.filter((w) => w.isOwned)
        if (activeFilter === 'Shared with me') list = list.filter((w) => !w.isOwned)
        if (query.trim()) {
            const q = query.toLowerCase()
            list = list.filter((w) => w.name.toLowerCase().includes(q))
        }
        return list
    }, [workspaces, activeFilter, query])

    const roleColor = (role?: string) => {
        switch (role) {
            case 'owner': return 'bg-navy/10 text-[#1e3a5f]'
            case 'developer': return 'bg-teal-50 text-teal-700'
            case 'member': return 'bg-sky-50 text-sky-700'
            case 'viewer': return 'bg-slate-100 text-slate-600'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${activeFilter === tab
                                ? 'bg-[#1e3a5f] text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search workspaces..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:w-64"
                    />
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                    No workspaces match your search.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((ws) => (
                        <Link
                            key={ws.id}
                            href={`/workspace/kanban?workspaceId=${ws.id}`}
                            className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-lg font-bold text-teal-600 transition group-hover:bg-teal-600 group-hover:text-white">
                                    {ws.name.slice(0, 1).toUpperCase()}
                                </div>
                                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${roleColor(ws.role)}`}>
                                    {ws.role || 'member'}
                                </span>
                            </div>
                            <h3 className="mt-3 text-sm font-semibold text-slate-800">{ws.name}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">/{ws.slug}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
