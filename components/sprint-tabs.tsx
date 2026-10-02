'use client'

import { useState } from 'react'
import { type Task } from '@/app/(dashboard)/workspace/kanban/kanban-board'

type Tab = 'Summary' | 'Board' | 'Backlog' | 'Timeline'

const TABS: Tab[] = ['Summary', 'Board', 'Backlog', 'Timeline']

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
        </div>
    )
}

function SummaryTab({ tasks }: { tasks: Task[] }) {
    const total = tasks.length
    const todo = tasks.filter((t) => t.status === 'todo').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const done = tasks.filter((t) => t.status === 'done').length

    const high = tasks.filter((t) => t.priority === 'high').length
    const medium = tasks.filter((t) => t.priority === 'medium').length
    const low = tasks.filter((t) => t.priority === 'low').length

    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0

    // Unique tags distribution
    const tagMap: Record<string, number> = {}
    tasks.forEach((t) => t.tags?.forEach((tag) => { tagMap[tag] = (tagMap[tag] || 0) + 1 }))
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

    // Overdue
    const today = new Date().toISOString().split('T')[0]
    const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done').length

    return (
        <div className="flex flex-col gap-8 p-8">
            {/* Status stats */}
            <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">By Status</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Total" value={total} color="text-slate-800" />
                    <StatCard label="To Do" value={todo} color="text-slate-600" />
                    <StatCard label="In Progress" value={inProgress} color="text-amber-600" />
                    <StatCard label="Done" value={done} color="text-teal-600" />
                </div>
            </div>

            {/* Completion bar */}
            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Sprint Progress</span>
                    <span className="text-sm font-semibold text-teal-600">{completionPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-700"
                        style={{ width: `${completionPct}%` }}
                    />
                </div>
            </div>

            {/* Priority + overdue row */}
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
                                    <div
                                        className={`h-full rounded-full ${bg} transition-all duration-500`}
                                        style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                                    />
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
                            <span className="text-lg font-bold text-slate-500">
                                {tasks.filter((t) => !t.due_date).length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top tags */}
            {topTags.length > 0 && (
                <div>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Top Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {topTags.map(([tag, count]) => (
                            <span
                                key={tag}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                            >
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
                <p className="mt-1 max-w-xs text-sm text-slate-400">
                    A Gantt-style view showing task deadlines and sprint milestones across time.
                </p>
            </div>
            {/* Visual stub bars */}
            <div className="w-full max-w-md space-y-2 opacity-30">
                {[80, 55, 90, 40, 65].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-teal-400" />
                        <div className="flex-1 rounded-full bg-slate-200 h-3 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-sky-400"
                                style={{ width: `${w}%`, marginLeft: `${i * 5}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function SprintTabs({
    tasks,
    board,
    backlogHref,
}: {
    tasks: Task[]
    board: React.ReactNode
    backlogHref: string
}) {
    const [activeTab, setActiveTab] = useState<Tab>('Board')

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-8">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-4 py-3 text-sm font-medium transition ${
                            activeTab === tab
                                ? 'text-[#1e3a5f]'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1e3a5f]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {activeTab === 'Summary' && (
                    <div className="flex-1 overflow-y-auto">
                        <SummaryTab tasks={tasks} />
                    </div>
                )}
                {activeTab === 'Board' && board}
                {activeTab === 'Backlog' && (
                    <div className="flex flex-1 items-center justify-center">
                        <a
                            href={backlogHref}
                            className="flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]"
                        >
                            Go to Project Backlog →
                        </a>
                    </div>
                )}
                {activeTab === 'Timeline' && <TimelineTab />}
            </div>
        </div>
    )
}
