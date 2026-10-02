'use client'

// tldraw CSS — must be imported for the canvas to render correctly
import '@tldraw/tldraw/tldraw.css'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
    LiveblocksProvider,
    RoomProvider,
    useRoom,
    ClientSideSuspense,
} from '@liveblocks/react'
import { Tldraw } from '@tldraw/tldraw'
import { isReadOnly, type WorkspaceRole } from '@/lib/rbac'
import { saveWhiteboard } from '@/app/(dashboard)/workspace/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type TldrawBoardProps = {
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

// ─── Inner board: tldraw + Liveblocks Yjs sync ────────────────────────────────
// Wrapped in next/dynamic (ssr:false) — Tldraw uses window/canvas APIs.
// useRoom() is valid here because this component renders inside <RoomProvider>.

function TldrawBoard({ projectId, workspaceId, initialData, userRole }: TldrawBoardProps) {
    const room = useRoom()
    const [editor, setEditor] = useState<any>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const viewOnly = isReadOnly(userRole)

    // ── Yjs ↔ tldraw sync ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!editor || !room) return

        let destroyed = false
        let cleanupFns: Array<() => void> = []

        async function setup() {
            const [{ Doc }, { LiveblocksYjsProvider }] = await Promise.all([
                import('yjs'),
                import('@liveblocks/yjs'),
            ])

            if (destroyed) return

            const yDoc = new Doc()
            const provider = new LiveblocksYjsProvider(room, yDoc)
            const yRecords = yDoc.getMap<any>('tldraw')

            // Wait for Yjs to sync before potentially bootstrapping from DB
            await new Promise<void>((resolve) => {
                if (provider.synced) return resolve()
                provider.once('synced', resolve)
                setTimeout(resolve, 3000) // don't block indefinitely
            })

            if (destroyed) return

            // Bootstrap from DB snapshot only when the room is empty
            if (yRecords.size === 0 && initialData?.store) {
                yDoc.transact(() => {
                    for (const [id, record] of Object.entries(initialData.store as Record<string, any>)) {
                        yRecords.set(id, record)
                    }
                })
            }

            // Apply current Yjs state to tldraw store
            if (yRecords.size > 0) {
                editor.store.mergeRemoteChanges(() => {
                    editor.store.put([...yRecords.values()])
                })
            }

            // 1. tldraw → Yjs: only broadcast user-initiated deltas
            const storeUnsub = editor.store.listen(
                (update: any) => {
                    if (update.source !== 'user') return // ignore remote echoes

                    yDoc.transact(() => {
                        for (const record of Object.values<any>(update.changes.added)) {
                            yRecords.set(record.id, record)
                        }
                        for (const [, next] of Object.values<any>(update.changes.updated)) {
                            yRecords.set(next.id, next)
                        }
                        for (const id of Object.keys(update.changes.removed)) {
                            yRecords.delete(id)
                        }
                    })

                    // Debounced silent DB save — no state mutation, no re-render
                    if (!viewOnly) {
                        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
                        saveTimerRef.current = setTimeout(async () => {
                            try {
                                const snapshot = editor.store.getSnapshot()
                                const fd = new FormData()
                                fd.set('projectId', projectId)
                                fd.set('data', JSON.stringify(snapshot))
                                await saveWhiteboard(fd)
                            } catch (err) {
                                console.error('[Whiteboard] DB save failed:', err)
                            }
                        }, 2000)
                    }
                },
                { source: 'user', scope: 'document' }
            )

            // 2. Yjs → tldraw: merge remote changes safely (won't echo back)
            const yObserver = (event: any) => {
                if (destroyed) return
                editor.store.mergeRemoteChanges(() => {
                    const puts: any[] = []
                    const deletes: string[] = []

                    event.changes.keys.forEach((change: any, key: string) => {
                        if (change.action === 'add' || change.action === 'update') {
                            const record = yRecords.get(key)
                            if (record) puts.push(record)
                        } else if (change.action === 'delete') {
                            deletes.push(key)
                        }
                    })

                    if (puts.length > 0) editor.store.put(puts)
                    if (deletes.length > 0) editor.store.remove(deletes as any)
                })
            }

            yRecords.observe(yObserver)

            cleanupFns = [
                storeUnsub,
                () => yRecords.unobserve(yObserver),
                () => provider.destroy(),
                () => yDoc.destroy(),
            ]
        }

        setup().catch(console.error)

        return () => {
            destroyed = true
            cleanupFns.forEach((fn) => fn())
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, room])

    return (
        // Explicit dimensions are required — tldraw uses absolute positioning internally
        <div className="relative h-full w-full" style={{ minHeight: 600 }}>
            {viewOnly && (
                <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-md ring-1 ring-slate-200 backdrop-blur-sm">
                    👁 View only · Updates live as your team draws
                </div>
            )}
            <Tldraw
                onMount={setEditor}
                isReadonly={viewOnly}
            />
        </div>
    )
}

// Dynamically imported so Tldraw's browser APIs (window/canvas) never run on the server
const TldrawBoardDynamic = dynamic(
    () => Promise.resolve(TldrawBoard),
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
        <div className="relative h-full w-full flex-1 overflow-hidden">
            <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
                <RoomProvider
                    id={roomId}
                    initialPresence={{ cursor: null }}
                >
                    {/*
                      ClientSideSuspense shows the skeleton while Liveblocks
                      is authenticating. Without it the canvas is blank during auth.
                    */}
                    <ClientSideSuspense fallback={<WhiteboardSkeleton />}>
                        <TldrawBoardDynamic
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
