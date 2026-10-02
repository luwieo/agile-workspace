'use client'

import { useState, useRef } from 'react'

export type AvatarMember = {
    userId: string
    name: string
    role?: string
    email?: string
    avatarUrl?: string | null
    username?: string | null
}

const MAX_VISIBLE = 4

function Avatar({ member, size = 'md' }: { member: AvatarMember; size?: 'sm' | 'md' }) {
    const initials = member.name
        ? member.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : '?'

    const sizeClasses = size === 'sm'
        ? 'h-7 w-7 text-[10px]'
        : 'h-8 w-8 text-xs'

    if (member.avatarUrl) {
        return (
            <img
                src={member.avatarUrl}
                alt={member.name}
                className={`${sizeClasses} rounded-full object-cover`}
            />
        )
    }

    // Deterministic pastel bg from userId
    const hue = member.userId.charCodeAt(0) * 37 % 360
    return (
        <div
            style={{ background: `hsl(${hue}, 60%, 85%)`, color: `hsl(${hue}, 45%, 30%)` }}
            className={`${sizeClasses} flex items-center justify-center rounded-full font-bold`}
        >
            {initials}
        </div>
    )
}

function RoleBadge({ role }: { role?: string }) {
    const styles: Record<string, string> = {
        owner: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
        developer: 'bg-teal-50 text-teal-700',
        member: 'bg-sky-50 text-sky-700',
        viewer: 'bg-slate-100 text-slate-600',
    }
    const cls = styles[role || ''] || styles.member
    return (
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>
            {role || 'member'}
        </span>
    )
}

export default function MemberAvatarGroup({ members }: { members: AvatarMember[] }) {
    const [open, setOpen] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const visible = members.slice(0, MAX_VISIBLE)
    const overflow = members.length - MAX_VISIBLE

    function handleEnter() {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setOpen(true)
    }

    function handleLeave() {
        timeoutRef.current = setTimeout(() => setOpen(false), 150)
    }

    if (members.length === 0) return null

    return (
        <div className="relative flex items-center" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            {/* Stacked avatars */}
            <div className="flex items-center -space-x-2">
                {visible.map((m) => (
                    <div
                        key={m.userId}
                        title={m.name}
                        className="rounded-full ring-2 ring-white transition hover:z-10 hover:scale-110"
                    >
                        <Avatar member={m} />
                    </div>
                ))}
                {overflow > 0 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ring-2 ring-white">
                        +{overflow}
                    </div>
                )}
            </div>

            {/* Hover popover */}
            {open && (
                <div
                    className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl"
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                >
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Team Members ({members.length})
                    </p>
                    <ul className="space-y-1 max-h-72 overflow-y-auto">
                        {members.map((m) => (
                            <li key={m.userId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                                <Avatar member={m} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-800">{m.name}</p>
                                    {m.username && (
                                        <p className="truncate text-xs text-slate-400">@{m.username}</p>
                                    )}
                                </div>
                                <RoleBadge role={m.role} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
