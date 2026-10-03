'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribes to Postgres changes on `workspace_members` and `tasks` and calls
 * `router.refresh()` (debounced) so server-rendered stats + member lists update
 * on every open client without a hard reload.
 *
 * Requires both tables in the `supabase_realtime` publication.
 * RLS applies to realtime: clients only receive rows they can SELECT.
 * DELETE events can't be server-filtered by column, so filtering is done here.
 */
export function useWorkspaceRealtime(workspaceId?: string, projectId?: string) {
    const router = useRouter()
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!workspaceId) return
        const supabase = createClient()

        const scheduleRefresh = () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => router.refresh(), 250)
        }

        const channel = supabase
            .channel(`workspace-live:${workspaceId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'workspace_members' },
                (payload: any) => {
                    const row = payload.new?.workspace_id ? payload.new : payload.old
                    // Composite PK → old row on DELETE always carries workspace_id
                    if (!row?.workspace_id || row.workspace_id === workspaceId) scheduleRefresh()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                (payload: any) => {
                    const row = payload.new?.project_id ? payload.new : payload.old
                    // DELETE payload has only `id` unless REPLICA IDENTITY FULL → refresh anyway
                    if (!row?.project_id || !projectId || row.project_id === projectId) scheduleRefresh()
                }
            )
            .subscribe()

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            supabase.removeChannel(channel)
        }
    }, [workspaceId, projectId, router])
}
