'use client'

// Excalidraw CSS — required for correct rendering (MIT license, production-safe)
import '@excalidraw/excalidraw/index.css'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
    LiveblocksProvider,
    RoomProvider,
    useEventListener,
    useBroadcastEvent,
    useMyPresence,
    useOthers,
    ClientSideSuspense,
} from '@liveblocks/react'
import { isReadOnly, type WorkspaceRole } from '@/lib/rbac'
import { saveWhiteboard } from '@/app/(dashboard)/workspace/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type ExcalidrawAPI = {
    updateScene: (scene: { elements?: any[]; appState?: any; collaborators?: Map<string, any>; captureUpdate?: number }) => void
    getSceneElements: () => readonly any[]
    getSceneElementsIncludingDeleted: () => readonly any[]
    getAppState: () => any
}

type BoardProps = {
    projectId: string
    workspaceId: string
    initialData: Record<string, unknown> | null
    userRole: WorkspaceRole | null
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Inner board: Excalidraw + Liveblocks Broadcast sync + Live Cursors ───────

function ExcalidrawBoard({ projectId, workspaceId, initialData, userRole }: BoardProps) {
    const broadcast = useBroadcastEvent()
    const [, updateMyPresence] = useMyPresence()
    const others = useOthers()

    const excalidrawApiRef = useRef<ExcalidrawAPI | null>(null)
    const isRemoteUpdateRef = useRef(false)
    const lastBroadcastVersionRef = useRef<number>(0)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const viewOnly = isReadOnly(userRole)

    // Initial elements from DB (Excalidraw format or null)
    const initialElements: any[] = Array.isArray(initialData)
        ? initialData
        : Array.isArray((initialData as any)?.elements)
            ? (initialData as any).elements
            : []

    // ── Live Cursors: broadcast pointer position to Liveblocks presence ───────
    const handlePointerUpdate = useCallback((payload: { pointer: { x: number; y: number; tool: 'pointer' | 'laser' }; button: 'down' | 'up' }) => {
        updateMyPresence({
            cursor: { x: payload.pointer.x, y: payload.pointer.y },
            button: payload.button,
        })
    }, [updateMyPresence])

    const handlePointerLeave = useCallback(() => {
        updateMyPresence({ cursor: null, button: 'up' })
    }, [updateMyPresence])

    // ── Sync peers' presence (live cursors + nametags) into Excalidraw ────────
    useEffect(() => {
        if (!excalidrawApiRef.current) return
        const collaborators = new Map<string, any>()

        for (const other of others) {
            const presence = other.presence as any
            if (presence?.cursor) {
                const info = other.info as any
                collaborators.set(String(other.connectionId), {
                    pointer: presence.cursor,
                    button: presence.button || 'up',
                    username: info?.name || 'Anonymous',
                    avatarUrl: info?.avatar || undefined,
                    color: {
                        background: info?.color || '#0d9488',
                        stroke: info?.color || '#0d9488',
                    },
                })
            }
        }

        excalidrawApiRef.current.updateScene({ collaborators })
    }, [others])

    // ── Liveblocks broadcast sync & CRDT reconciliation ───────────────────────
    useEventListener(({ event }: { event: any }) => {
        if (event.type !== 'elements-update') return
        if (!excalidrawApiRef.current) return

        // CRDT merge via reconcileElements — resolves conflicts and handles deletions
        import('@excalidraw/excalidraw').then(({ reconcileElements, getSceneVersion }) => {
            if (!excalidrawApiRef.current) return
            // CRITICAL: Must include deleted elements so tombstones are preserved
            const localElements = excalidrawApiRef.current.getSceneElementsIncludingDeleted()
            const appState = excalidrawApiRef.current.getAppState()
            const merged = reconcileElements(
                localElements as any,
                event.elements,
                appState
            )

            lastBroadcastVersionRef.current = getSceneVersion(merged)
            isRemoteUpdateRef.current = true

            // captureUpdate: 2 (CaptureUpdateAction.NEVER) so remote updates don't break undo/redo
            excalidrawApiRef.current.updateScene({ elements: merged, captureUpdate: 2 })
        }).catch(() => {
            if (!excalidrawApiRef.current) return
            isRemoteUpdateRef.current = true
            excalidrawApiRef.current.updateScene({ elements: event.elements, captureUpdate: 2 })
        })
    })

    // ── Canvas change → broadcast + debounced DB save ─────────────────────────
    const handleChange = useCallback((elements: readonly any[]) => {
        // Suppress echo: this change was triggered by a remote updateScene()
        if (isRemoteUpdateRef.current) {
            isRemoteUpdateRef.current = false
            return
        }

        import('@excalidraw/excalidraw').then(({ getSceneVersion }) => {
            const currentVersion = getSceneVersion(elements)
            // If scene elements version hasn't changed (e.g. only selection changed), skip broadcast
            if (currentVersion === lastBroadcastVersionRef.current) return
            lastBroadcastVersionRef.current = currentVersion

            // Broadcast to peers via Liveblocks
            broadcast({ type: 'elements-update', elements: [...elements] })
        }).catch(() => {
            broadcast({ type: 'elements-update', elements: [...elements] })
        })

        if (viewOnly) return

        // Debounced silent DB save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(async () => {
            try {
                const fd = new FormData()
                fd.set('projectId', projectId)
                fd.set('data', JSON.stringify(elements))
                await saveWhiteboard(fd)
            } catch (err) {
                console.error('[Whiteboard] DB save failed:', err)
            }
        }, 2000)
    }, [broadcast, viewOnly, projectId])

    // Lazy-load Excalidraw component (browser-only APIs)
    const ExcalidrawComponent = useLazyExcalidraw()
    if (!ExcalidrawComponent) return <WhiteboardSkeleton />

    return (
        <div
            onPointerLeave={handlePointerLeave}
            style={{ width: '100%', height: '70vh', minHeight: '600px', position: 'relative' }}
        >
            {viewOnly && (
                <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-md ring-1 ring-slate-200 backdrop-blur-sm">
                    👁 View only · Updates live as your team draws
                </div>
            )}
            <ExcalidrawComponent
                initialData={{
                    elements: initialElements,
                    appState: { viewModeEnabled: viewOnly },
                }}
                viewModeEnabled={viewOnly}
                onChange={(elements: readonly any[], _appState: any, _files: any) => handleChange(elements)}
                onPointerUpdate={handlePointerUpdate}
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
    )
}

// Lazy-load Excalidraw inside a hook — avoids SSR (window/canvas APIs)
function useLazyExcalidraw() {
    const [Component, setComponent] = useState<any>(null)
    useEffect(() => {
        import('@excalidraw/excalidraw')
            .then(({ Excalidraw }) => setComponent(() => Excalidraw))
            .catch(console.error)
    }, [])
    return Component
}

// Wrap in next/dynamic so the whole subtree is client-only
const ExcalidrawBoardDynamic = dynamic(
    () => Promise.resolve(ExcalidrawBoard),
    { ssr: false, loading: () => <WhiteboardSkeleton /> }
)

// ─── Public export: providers ─────────────────────────────────────────────────

export default function WhiteboardTab({
    projectId,
    workspaceId,
    initialData,
    userRole,
}: {
    projectId: string
    workspaceId: string
    initialData: Record<string, unknown> | null
    userRole: WorkspaceRole | null
}) {
    const roomId = `whiteboard-${workspaceId}`

    return (
        <div className="relative w-full flex-1">
            <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
                <RoomProvider
                    id={roomId}
                    initialPresence={{ cursor: null, button: 'up' }}
                >
                    <ClientSideSuspense fallback={<WhiteboardSkeleton />}>
                        <ExcalidrawBoardDynamic
                            projectId={projectId}
                            workspaceId={workspaceId}
                            initialData={initialData}
                            userRole={userRole}
                        />
                    </ClientSideSuspense>
                </RoomProvider>
            </LiveblocksProvider>
        </div>
    )
}
