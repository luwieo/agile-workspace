'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AvatarMember = {
    userId: string
    name: string
    role?: string
    email?: string
    avatarUrl?: string | null
    username?: string | null
}

type PresencePayload = {
    userId: string
    name: string
    username?: string | null
    role?: string
    avatarUrl?: string | null
}

const MAX_VISIBLE = 3 // show 3 avatars + "+N" when more than 4 online

function Avatar({
    member,
    size = 'md',
    isLive = false,
    isSelf = false,
}: {
    member: AvatarMember | PresencePayload
    size?: 'sm' | 'md'
    isLive?: boolean
    isSelf?: boolean
}) {
    const name = member.name || ''
    const initials = name
        ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : '?'

    const sizeClasses = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs'

    // Deterministic pastel hue from userId
    const hue = member.userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 37 % 360

    const img = 'avatarUrl' in member ? member.avatarUrl : null

    return (
        <div className="relative">
            {img ? (
                <img
                    src={img}
                    alt={name}
                    className={`${sizeClasses} rounded-full object-cover`}
                />
            ) : (
                <div
                    style={{ background: `hsl(${hue}, 60%, 85%)`, color: `hsl(${hue}, 45%, 30%)` }}
                    className={`${sizeClasses} flex items-center justify-center rounded-full font-bold`}
                >
                    {initials}
                </div>
            )}
            {isLive && (
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white" />
            )}
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
    const cls = styles[role || ''] ?? styles.member
    return (
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>
            {role || 'member'}
        </span>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemberAvatarGroup({
    currentUser,
    workspaceId,
    members = [],
}: {
    currentUser: AvatarMember
    workspaceId: string
    members?: AvatarMember[]
}) {
    const [onlineUsers, setOnlineUsers] = useState<PresencePayload[]>([])
    const [open, setOpen] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Supabase Presence subscription ──────────────────────────────────────
    useEffect(() => {
        const supabase = createClient()

        // Key by userId so multiple tabs from the same user collapse into one slot
        const channel = supabase.channel(`presence:workspace-${workspaceId}`, {
            config: { presence: { key: currentUser.userId } },
        })

        // Sync helper: collapse presenceState (which may have multiple tabs per key) into unique users
        function syncPresence() {
            const state = channel.presenceState<PresencePayload>()
            const seen = new Set<string>()
            const users: PresencePayload[] = []

            for (const presences of Object.values(state)) {
                // Take the first entry per key (key === userId, already unique)
                const entry = presences[0]
                if (entry && !seen.has(entry.userId)) {
                    seen.add(entry.userId)
                    users.push(entry)
                }
            }

            setOnlineUsers(users)
        }

        channel
            .on('presence', { event: 'sync' }, syncPresence)
            .on('presence', { event: 'join' }, syncPresence)
            .on('presence', { event: 'leave' }, syncPresence)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        userId: currentUser.userId,
                        name: currentUser.name,
                        username: currentUser.username ?? null,
                        role: currentUser.role ?? 'member',
                        avatarUrl: currentUser.avatarUrl ?? null,
                    } satisfies PresencePayload)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, currentUser.userId])

    // ── Hover popover helpers ────────────────────────────────────────────────
    function handleEnter() {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setOpen(true)
    }
    function handleLeave() {
        timeoutRef.current = setTimeout(() => setOpen(false), 150)
    }

    // ── Merge presence + static member list for role/avatar fallback ─────────
    // If presence doesn't have a role (shouldn't happen, but safe), fall back to members list
    function enriched(p: PresencePayload): PresencePayload & { isSelf: boolean } {
        const fallback = members.find((m) => m.userId === p.userId)
        return {
            ...p,
            role: p.role ?? fallback?.role,
            avatarUrl: p.avatarUrl ?? fallback?.avatarUrl ?? null,
            isSelf: p.userId === currentUser.userId,
        }
    }

    const users = onlineUsers.map(enriched)
    const visible = users.slice(0, MAX_VISIBLE)
    const overflow = users.length - MAX_VISIBLE

    if (users.length === 0) return null

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            {/* Stacked live avatars */}
            <div className="flex items-center -space-x-2">
                {visible.map((u) => (
                    <div
                        key={u.userId}
                        title={u.isSelf ? `${u.name} (you)` : u.name}
                        className={`rounded-full ring-2 transition hover:z-10 hover:scale-110 ${
                            u.isSelf ? 'ring-teal-400' : 'ring-white'
                        }`}
                    >
                        <Avatar member={u} isLive isSelf={u.isSelf} />
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
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-teal-600">
                        Active Now ({users.length})
                    </p>
                    <ul className="max-h-72 space-y-1 overflow-y-auto">
                        {users.map((u) => (
                            <li
                                key={u.userId}
                                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                            >
                                <Avatar member={u} size="sm" isLive />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                        {u.name}
                                        {u.isSelf && (
                                            <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                                        )}
                                    </p>
                                    {u.username && (
                                        <p className="truncate text-xs text-slate-400">@{u.username}</p>
                                    )}
                                </div>
                                <RoleBadge role={u.role} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
