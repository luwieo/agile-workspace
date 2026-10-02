'use client'

// Required — without this, Excalidraw renders as raw unstyled HTML/SVG
import '@excalidraw/excalidraw/index.css'

import { useEffect, useRef, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { isReadOnly, type WorkspaceRole } from '@/lib/rbac'
import { saveWhiteboard } from '@/app/(dashboard)/workspace/actions'

// Excalidraw must be loaded client-side only — it uses window/canvas APIs
const ExcalidrawComponent = dynamic(
    async () => {
        const { Excalidraw } = await import('@excalidraw/excalidraw')
        return Excalidraw
    },
    { ssr: false, loading: () => <WhiteboardSkeleton /> }
)

function WhiteboardSkeleton() {
    return (
        <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-4 bg-slate-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Loading whiteboard…</p>
        </div>
    )
}

type ExcalidrawAPI = {
    updateScene: (scene: { elements: any[]; appState?: any }) => void
    getSceneElements: () => any[]
}

function userColor(userId: string) {
    const hue = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 47 % 360
    return `hsl(${hue}, 65%, 48%)`
}

export default function WhiteboardTab({
    projectId,
    initialData,
    currentUser,
    userRole,
}: {
    projectId: string
    initialData: any[]
    currentUser: { id: string; name: string }
    userRole: WorkspaceRole | null
}) {
    const excalidrawApiRef = useRef<ExcalidrawAPI | null>(null)
    const isSuppressingRef = useRef(false)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cursorThrottleRef = useRef<number>(0)
    const [cursors, setCursors] = useState<Record<string, { name: string; x: number; y: number; color: string }>>({})
    const viewOnly = isReadOnly(userRole)

    // canSend() mirrors the exact check inside Supabase's send():
    // socket.isConnected() && channelAdapter.state === 'joined'
    // Using ch.state alone misses socket connectivity, causing REST fallback.
    const canSend = () => (channelRef.current as any)?.channelAdapter?.canPush() === true

    // channelRef is populated inside the effect so Strict Mode cleanup fully
    // removes the channel before the second mount creates a fresh instance.
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

    // ── Realtime setup ───────────────────────────────────────────────────────
    useEffect(() => {
        const supabase = createClient()

        // Create a FRESH channel inside the effect so the cleanup can fully
        // remove it — prevents the Strict Mode "join called twice" error.
        const ch = supabase.channel(`whiteboard:${projectId}`, {
            config: {
                broadcast: { self: false, ack: false },
                presence: { key: currentUser.id },
            },
        })
        channelRef.current = ch

        ch.on('broadcast', { event: 'elements-update' }, ({ payload }) => {
            if (!excalidrawApiRef.current) return
            // Set the suppress flag BEFORE updateScene() — Excalidraw's onChange
            // fires synchronously inside updateScene, so the flag must already be
            // true when handleChange is called. It is reset inside handleChange
            // itself (not via setTimeout) to guarantee correct ordering.
            isSuppressingRef.current = true
            excalidrawApiRef.current.updateScene({ elements: payload.elements })
            // If onChange was NOT called (e.g. elements unchanged), reset here
            // as a safety net so future local edits aren't silently swallowed.
            if (isSuppressingRef.current) isSuppressingRef.current = false
        })

        ch.on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
            setCursors((prev) => ({
                ...prev,
                [payload.userId]: { name: payload.name, x: payload.x, y: payload.y, color: userColor(payload.userId) },
            }))
        })

        ch.on('presence', { event: 'leave' }, ({ leftPresences }) => {
            setCursors((prev) => {
                const next = { ...prev }
                for (const p of leftPresences as any[]) delete next[p.key ?? p.userId]
                return next
            })
        })

        ch.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                ch.track({ userId: currentUser.id, name: currentUser.name })
            }
            // No need to track ready state manually — canSend() reads ch.state directly
        })

        return () => {
            supabase.removeChannel(ch)
            channelRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId])

    // ── Broadcast cursor on pointer move — throttled to 100ms ────────────────
    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (viewOnly || !canSend()) return
        const now = Date.now()
        if (now - cursorThrottleRef.current < 100) return
        cursorThrottleRef.current = now
        channelRef.current?.send({
            type: 'broadcast',
            event: 'cursor-move',
            payload: { userId: currentUser.id, name: currentUser.name, x: e.clientX, y: e.clientY },
        })
    }, [viewOnly, currentUser.id, currentUser.name])

    // ── Canvas change → broadcast + debounced save ──────────────────────────
    const handleChange = useCallback((elements: readonly any[]) => {
        // Reset suppress flag synchronously — this is the loop-breaker.
        // If the change was triggered by our own updateScene() (remote data),
        // isSuppressingRef is true here. We reset it and return WITHOUT
        // broadcasting so the remote change is NOT echoed back to peers.
        if (isSuppressingRef.current) {
            isSuppressingRef.current = false
            return
        }

        // Only broadcast if the WebSocket channel is fully joined
        if (!canSend()) return

        // Local user drew something — broadcast to peers
        channelRef.current?.send({
            type: 'broadcast',
            event: 'elements-update',
            payload: { elements },
        })

        // Viewers never persist
        if (viewOnly) return
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(async () => {
            try {
                const fd = new FormData()
                fd.set('projectId', projectId)
                fd.set('data', JSON.stringify(elements))
                await saveWhiteboard(fd)
            } catch (err) {
                console.error('[Whiteboard] Save failed:', err)
            }
        }, 1500)
    }, [viewOnly, projectId])

    return (
        <div
            className="relative flex-1 overflow-hidden"
            style={{ height: '100%' }}
            onPointerMove={handlePointerMove}
        >
            {/* Collaborator cursors overlay */}
            {Object.entries(cursors).map(([uid, c]) => (
                <div
                    key={uid}
                    className="pointer-events-none absolute z-50 flex items-center gap-1.5 transition-all duration-75"
                    style={{ left: c.x, top: c.y, transform: 'translate(10px, 10px)' }}
                >
                    <div className="h-3 w-3 rounded-full ring-2 ring-white shadow" style={{ background: c.color }} />
                    <span
                        className="rounded-lg px-2 py-0.5 text-[11px] font-semibold text-white shadow"
                        style={{ background: c.color }}
                    >
                        {c.name}
                    </span>
                </div>
            ))}

            {viewOnly && (
                <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-md ring-1 ring-slate-200 backdrop-blur-sm">
                    👁 View only · Updates live as your team draws
                </div>
            )}

            {/* Excalidraw needs an explicit-height parent — it positions its UI absolutely */}
            <div className="absolute inset-0">
                <ExcalidrawComponent
                    initialData={{ elements: initialData, appState: { viewModeEnabled: viewOnly } }}
                    viewModeEnabled={viewOnly}
                    onChange={(elements) => handleChange(elements)}
                    excalidrawAPI={(api: any) => { excalidrawApiRef.current = api }}
                    UIOptions={{
                        canvasActions: {
                            export: false,
                            loadScene: !viewOnly,
                            saveToActiveFile: false,
                        },
                    }}
                />
            </div>
        </div>
    )
}
