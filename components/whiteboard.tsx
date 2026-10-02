'use client'

// tldraw CSS \u2014 required for correct rendering
import '@tldraw/tldraw/tldraw.css'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { LiveblocksProvider, RoomProvider, useRoom } from '@liveblocks/react'
import { isReadOnly, type WorkspaceRole } from '@/lib/rbac'
import { saveWhiteboard } from '@/app/(dashboard)/workspace/actions'

// \u2500\u2500\u2500 Types \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

type TldrawBoardProps = {
    projectId: string
    workspaceId: string
    initialData: Record<string, unknown> | null
    userRole: WorkspaceRole | null
}

// \u2500\u2500\u2500 Skeleton \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function WhiteboardSkeleton() {
    return (
        <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-4 bg-slate-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Loading whiteboard\u2026</p>
        </div>
    )
}

// \u2500\u2500\u2500 Inner board (tldraw + Liveblocks Yjs sync) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// Must be client-only \u2014 tldraw uses window/canvas APIs
const TldrawBoardDynamic = dynamic(
    () => Promise.resolve(TldrawBoard),
    { ssr: false, loading: () => <WhiteboardSkeleton /> }
)

function TldrawBoard({ projectId, workspaceId, initialData, userRole }: TldrawBoardProps) {
    const room = useRoom()
    const [editor, setEditor] = useState<any>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const viewOnly = isReadOnly(userRole)

    // \u2500\u2500 Yjs \u21c4 tldraw sync \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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
            // Yjs map keyed by tldraw record ID
            const yRecords = yDoc.getMap<any>('tldraw')

            // \u2014\u2014 1. Initial load from Yjs (Liveblocks syncs this from the room) \u2014\u2014
            // If the room is empty, bootstrap from the DB snapshot (initialData).
            // We wait for Yjs to sync first to avoid overwriting peer state.
            const waitForSync = () => new Promise<void>((resolve) => {
                if (provider.synced) return resolve()
                provider.once('synced', resolve)
                // Timeout after 3s so we don\u2019t block indefinitely
                setTimeout(resolve, 3000)
            })

            await waitForSync()
            if (destroyed) return

            if (yRecords.size === 0 && initialData?.store) {
                // Bootstrap from DB snapshot (first user to open an empty board)
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

            // \u2014\u2014 2. tldraw \u2192 Yjs: broadcast only local user changes (deltas, not snapshots) \u2014\u2014
            const storeUnsub = editor.store.listen(
                (update: any) => {
                    // source === 'user' means the local user drew it.
                    // Ignore 'remote' \u2014 that\u2019s what we applied from Yjs; re-broadcasting would loop.
                    if (update.source !== 'user') return

                    yDoc.transact(() => {
                        // Added + updated records
                        for (const record of Object.values<any>(update.changes.added)) {
                            yRecords.set(record.id, record)
                        }
                        for (const [, next] of Object.values<any>(update.changes.updated)) {
                            yRecords.set(next.id, next)
                        }
                        // Removed records
                        for (const id of Object.keys(update.changes.removed)) {
                            yRecords.delete(id)
                        }
                    })

                    // Debounced DB save (background, no re-render)
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
                // Only listen to document-scope changes (not UI state like viewport)
                { source: 'user', scope: 'document' }
            )

            // \u2014\u2014 3. Yjs \u2192 tldraw: merge remote changes safely \u2014\u2014
            const yObserver = (event: any) => {
                if (destroyed) return
                editor.store.mergeRemoteChanges(() => {
                    // Put added/updated records
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

    // \u2500\u2500 Render \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

    // Import Tldraw lazily within the dynamic component
    const TldrawComponent = useTldrawComponent()

    if (!TldrawComponent) return <WhiteboardSkeleton />

    return (
        <div className="absolute inset-0">
            {viewOnly && (
                <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-md ring-1 ring-slate-200 backdrop-blur-sm">
                    \ud83d\udc41 View only \u00b7 Updates live as your team draws
                </div>
            )}
            <TldrawComponent
                onMount={setEditor}
                readOnly={viewOnly}
            />
        </div>
    )
}

// Lazy-load tldraw inside a hook to avoid SSR issues
function useTldrawComponent() {
    const [Component, setComponent] = useState<any>(null)
    useEffect(() => {
        import('@tldraw/tldraw').then(({ Tldraw }) => setComponent(() => Tldraw))
    }, [])
    return Component
}

// \u2500\u2500\u2500 Public export: wraps in Liveblocks + Room providers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

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
        <div className="relative flex-1 overflow-hidden" style={{ height: '100%' }}>
            <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
                <RoomProvider
                    id={roomId}
                    initialPresence={{ cursor: null }}
                >
                    <TldrawBoardDynamic
                        projectId={projectId}
                        workspaceId={workspaceId}
                        initialData={initialData}
                        userRole={userRole}
                    />
                </RoomProvider>
            </LiveblocksProvider>
        </div>
    )
}

