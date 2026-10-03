'use client'

import { useState, useTransition, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { type Task } from '@/app/(dashboard)/workspace/kanban/kanban-board'
import { type AvatarMember } from '@/components/member-avatar-group'
import {
    updateWorkspaceTags,
    removeWorkspaceMember,
    updateMemberRole,
    addWorkspaceMember,
} from '@/app/(dashboard)/workspace/actions'
import { type WorkspaceRole } from '@/lib/rbac'
import { useWorkspaceRealtime } from '@/lib/hooks/use-workspace-realtime'

// Excalidraw + Liveblocks use browser-only APIs — must be dynamic
const WhiteboardTab = dynamic(() => import('@/components/whiteboard'), { ssr: false })

type Tab = 'Summary' | 'Board' | 'Backlog' | 'Whiteboard' | 'Timeline' | 'Settings'

const BASE_TABS: Tab[] = ['Summary', 'Board', 'Backlog', 'Whiteboard', 'Timeline']

// ─── Shared ───────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
    developer: 'bg-teal-50 text-teal-700',
    member: 'bg-sky-50 text-sky-700',
    viewer: 'bg-slate-100 text-slate-600',
}

const ROLE_OPTIONS = ['developer', 'member', 'viewer'] as const

function MemberAvatar({ member, size = 'md' }: { member: AvatarMember; size?: 'sm' | 'md' }) {
    const initials = member.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'
    const hue = member.userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 37 % 360
    const cls = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-xs'
    return member.avatarUrl ? (
        <img src={member.avatarUrl} alt={member.name} className={`${cls} rounded-full object-cover`} />
    ) : (
        <div
            style={{ background: `hsl(${hue},60%,85%)`, color: `hsl(${hue},45%,30%)` }}
            className={`${cls} flex items-center justify-center rounded-full font-bold`}
        >
            {initials}
        </div>
    )
}

// ─── Summary tab ─────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
        </div>
    )
}

function SummaryTab({ tasks, members }: { tasks: Task[]; members: AvatarMember[] }) {
    const total = tasks.length
    const todo = tasks.filter((t) => t.status === 'todo').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const done = tasks.filter((t) => t.status === 'done').length
    const high = tasks.filter((t) => t.priority === 'high').length
    const medium = tasks.filter((t) => t.priority === 'medium').length
    const low = tasks.filter((t) => t.priority === 'low').length
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0

    const tagMap: Record<string, number> = {}
    tasks.forEach((t) => t.tags?.forEach((tag) => { tagMap[tag] = (tagMap[tag] || 0) + 1 }))
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

    const today = new Date().toISOString().split('T')[0]
    const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done').length

    const roleCounts = members.reduce<Record<string, number>>((acc, m) => {
        const r = m.role || 'member'
        acc[r] = (acc[r] || 0) + 1
        return acc
    }, {})

    return (
        <div className="flex flex-col gap-8 p-8">
            {members.length > 0 && (
                <div>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Workspace Members ({members.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap gap-3">
                                {members.map((m) => (
                                    <div key={m.userId} className="flex items-center gap-2">
                                        <MemberAvatar member={m} size="sm" />
                                        <div>
                                            <p className="text-xs font-medium text-slate-700">{m.name}</p>
                                            {m.username && <p className="text-[10px] text-slate-400">@{m.username}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">By Role</p>
                            <div className="space-y-2">
                                {Object.entries(roleCounts).map(([role, count]) => (
                                    <div key={role} className="flex items-center justify-between">
                                        <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold capitalize ${ROLE_COLORS[role] || ROLE_COLORS.member}`}>
                                            {role}
                                        </span>
                                        <span className="text-sm font-bold text-slate-700">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">By Status</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Total" value={total} color="text-slate-800" />
                    <StatCard label="To Do" value={todo} color="text-slate-600" />
                    <StatCard label="In Progress" value={inProgress} color="text-amber-600" />
                    <StatCard label="Done" value={done} color="text-teal-600" />
                </div>
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Sprint Progress</span>
                    <span className="text-sm font-semibold text-teal-600">{completionPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{ width: `${completionPct}%` }} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">By Priority</h2>
                    <div className="space-y-2">
                        {[
                            { label: 'High', count: high, bg: 'bg-red-500', text: 'text-red-600' },
                            { label: 'Medium', count: medium, bg: 'bg-amber-400', text: 'text-amber-600' },
                            { label: 'Low', count: low, bg: 'bg-slate-300', text: 'text-slate-500' },
                        ].map(({ label, count, bg, text }) => (
                            <div key={label} className="flex items-center gap-3">
                                <span className={`w-14 text-xs font-medium ${text}`}>{label}</span>
                                <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2">
                                    <div className={`h-full rounded-full ${bg} transition-all duration-500`} style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
                                </div>
                                <span className="w-6 text-right text-xs font-semibold text-slate-600">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Deadlines</h2>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5">
                            <span className="text-sm font-medium text-red-700">Overdue</span>
                            <span className="text-lg font-bold text-red-600">{overdue}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                            <span className="text-sm font-medium text-slate-600">No deadline</span>
                            <span className="text-lg font-bold text-slate-500">{tasks.filter((t) => !t.due_date).length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {topTags.length > 0 && (
                <div>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Top Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {topTags.map(([tag, count]) => (
                            <span key={tag} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                                {tag}
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Timeline tab ─────────────────────────────────────────────────────────────

function TimelineTab() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-700">Timeline — Coming Soon</h3>
                <p className="mt-1 max-w-xs text-sm text-slate-400">A Gantt-style view showing task deadlines and sprint milestones across time.</p>
            </div>
            <div className="w-full max-w-md space-y-2 opacity-30">
                {[80, 55, 90, 40, 65].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-teal-400" />
                        <div className="flex-1 rounded-full bg-slate-200 h-3 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-sky-400" style={{ width: `${w}%`, marginLeft: `${i * 5}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Settings tab — inlined ───────────────────────────────────────────────────

type SettingsWorkspace = { id: string; name: string; slug: string; tags: string[] }

function TagEditor({ workspaceId, initial }: { workspaceId: string; initial: string[] }) {
    const [tags, setTags] = useState<string[]>(initial)
    const [input, setInput] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    function addTag() {
        const t = input.trim()
        if (!t || tags.includes(t)) { setInput(''); return }
        setTags((prev) => [...prev, t])
        setInput('')
    }

    function removeTag(tag: string) {
        setTags((prev) => prev.filter((t) => t !== tag))
    }

    function save() {
        setError(null); setSaved(false)
        const fd = new FormData()
        fd.set('workspaceId', workspaceId)
        fd.set('tags', JSON.stringify(tags))
        startTransition(async () => {
            try { await updateWorkspaceTags(fd); setSaved(true); setTimeout(() => setSaved(false), 2000) }
            catch (e: any) { setError(e?.message || 'Failed to save tags.') }
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex min-h-[2.5rem] flex-wrap gap-2">
                {tags.length === 0 && <span className="text-sm text-slate-400">No tags configured yet.</span>}
                {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="rounded-full text-slate-400 hover:text-red-500">×</button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="New tag name..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button type="button" onClick={addTag} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
                    + Add
                </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" onClick={save} disabled={isPending} className="rounded-xl bg-[#1e3a5f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488] disabled:opacity-50">
                {isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save Tags'}
            </button>
        </div>
    )
}

function MemberRow({ member, workspaceId, currentUserId, onRemoved, onRoleChanged }: {
    member: AvatarMember; workspaceId: string; currentUserId: string
    onRemoved: (id: string) => void; onRoleChanged: (id: string, role: string) => void
}) {
    const isSelf = member.userId === currentUserId
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newRole = e.target.value; setError(null)
        const fd = new FormData()
        fd.set('workspaceId', workspaceId); fd.set('targetUserId', member.userId); fd.set('role', newRole)
        startTransition(async () => {
            try { await updateMemberRole(fd); onRoleChanged(member.userId, newRole) }
            catch (err: any) { setError(err?.message || 'Failed to change role.') }
        })
    }

    function handleRemove() {
        if (!confirm(`Remove ${member.name} from this workspace?`)) return
        setError(null)
        const fd = new FormData()
        fd.set('workspaceId', workspaceId); fd.set('targetUserId', member.userId)
        startTransition(async () => {
            try { await removeWorkspaceMember(fd); onRemoved(member.userId) }
            catch (err: any) { setError(err?.message || 'Failed to remove member.') }
        })
    }

    return (
        <li className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <MemberAvatar member={member} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                    {member.name}
                    {isSelf && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                </p>
                {member.username && <p className="truncate text-xs text-slate-400">@{member.username}</p>}
                {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
            </div>
            {member.role === 'owner' || isSelf ? (
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_COLORS[member.role || 'member']}`}>{member.role}</span>
            ) : (
                <select defaultValue={member.role || 'member'} disabled={isPending} onChange={handleRoleChange}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-teal-500">
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
            )}
            {!isSelf && member.role !== 'owner' && (
                <button type="button" onClick={handleRemove} disabled={isPending} title="Remove member"
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                </button>
            )}
        </li>
    )
}

function AddMemberForm({ workspaceId, onAdded }: { workspaceId: string; onAdded: () => void }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault(); setError(null); setSuccess(false)
        const formData = new FormData(e.currentTarget)
        formData.set('workspaceId', workspaceId)
        const form = e.currentTarget
        startTransition(async () => {
            try { await addWorkspaceMember(formData); form.reset(); setSuccess(true); onAdded(); setTimeout(() => setSuccess(false), 2000) }
            catch (err: any) { setError(err?.message || 'Failed to add member.') }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Email</label>
                <input name="email" type="email" required placeholder="teammate@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
            </div>
            <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Role</label>
                <select name="role" defaultValue="member" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500">
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
            </div>
            <button type="submit" disabled={isPending} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488] disabled:opacity-50">
                {isPending ? 'Inviting…' : 'Invite'}
            </button>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
            {success && <p className="w-full text-sm text-teal-700">Member added ✓</p>}
        </form>
    )
}

function SettingsTab({ workspace, members: initialMembers, currentUserId }: {
    workspace: SettingsWorkspace; members: AvatarMember[]; currentUserId: string
}) {
    const [members, setMembers] = useState<AvatarMember[]>(initialMembers)

    // Re-sync local state when the server re-renders with fresh data (realtime refresh)
    useEffect(() => { setMembers(initialMembers) }, [initialMembers])

    return (
        <div className="p-8">
            <div className="mx-auto max-w-3xl space-y-10">
                <div className="border-b border-slate-200 pb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Workspace Settings</h1>
                        <span className="rounded-lg bg-[#1e3a5f]/10 px-2.5 py-1 text-xs font-semibold text-[#1e3a5f]">Owner</span>
                    </div>
                    <p className="mt-1 text-slate-500">
                        <span className="font-medium text-slate-700">{workspace.name}</span>
                        {' '}<span className="text-slate-400">· /{workspace.slug}</span>
                    </p>
                </div>

                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Custom Task Tags</h2>
                        <p className="mt-0.5 text-sm text-slate-400">These tags appear as selectable chips when creating or editing tasks.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                        <TagEditor workspaceId={workspace.id} initial={workspace.tags} />
                    </div>
                </section>

                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Members</h2>
                        <p className="mt-0.5 text-sm text-slate-400">{members.length} member{members.length !== 1 ? 's' : ''} in this workspace.</p>
                    </div>
                    <ul className="space-y-2">
                        {members.map((m) => (
                            <MemberRow key={m.userId} member={m} workspaceId={workspace.id} currentUserId={currentUserId}
                                onRemoved={(id) => setMembers((prev) => prev.filter((x) => x.userId !== id))}
                                onRoleChanged={(id, role) => setMembers((prev) => prev.map((x) => x.userId === id ? { ...x, role } : x))}
                            />
                        ))}
                    </ul>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Invite New Member</h3>
                        <AddMemberForm workspaceId={workspace.id} onAdded={() => {}} />
                    </div>
                </section>
            </div>
        </div>
    )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function SprintTabs({
    tasks,
    members = [],
    board,
    backlogHref,
    isOwner = false,
    settingsData,
    projectId,
    workspaceId,
    whiteboardData = null,
    currentUser,
    userRole,
}: {
    tasks: Task[]
    members?: AvatarMember[]
    board: React.ReactNode
    backlogHref: string
    isOwner?: boolean
    settingsData?: {
        workspace: SettingsWorkspace
        members: AvatarMember[]
        currentUserId: string
    }
    projectId?: string
    workspaceId?: string
    whiteboardData?: Record<string, unknown> | null
    currentUser?: { id: string; name: string }
    userRole?: WorkspaceRole | null
}) {
    const tabs: Tab[] = isOwner ? [...BASE_TABS, 'Settings'] : BASE_TABS
    const [activeTab, setActiveTab] = useState<Tab>('Board')

    // Live-update stats + members across all clients
    useWorkspaceRealtime(workspaceId, projectId)

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-8">
                {tabs.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`relative px-4 py-3 text-sm font-medium transition ${activeTab === tab ? 'text-[#1e3a5f]' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab}
                        {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1e3a5f]" />}
                    </button>
                ))}
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
                {activeTab === 'Summary' && (
                    <div className="flex-1 overflow-y-auto"><SummaryTab tasks={tasks} members={members} /></div>
                )}
                {activeTab === 'Board' && board}
                {activeTab === 'Backlog' && (
                    <div className="flex flex-1 items-center justify-center">
                        <a href={backlogHref} className="flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]">
                            Go to Project Backlog →
                        </a>
                    </div>
                )}
                {activeTab === 'Timeline' && <TimelineTab />}
                {activeTab === 'Whiteboard' && projectId && workspaceId && (
                    <div className="flex flex-1">
                        <WhiteboardTab
                            projectId={projectId}
                            workspaceId={workspaceId}
                            initialData={whiteboardData}
                            userRole={userRole ?? null}
                        />
                    </div>
                )}
                {activeTab === 'Whiteboard' && (!projectId || !workspaceId) && (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                        No active workspace — open a workspace to use the whiteboard.
                    </div>
                )}
                {activeTab === 'Settings' && settingsData && (
                    <div className="flex-1 overflow-y-auto">
                        <SettingsTab
                            workspace={settingsData.workspace}
                            members={settingsData.members}
                            currentUserId={settingsData.currentUserId}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
