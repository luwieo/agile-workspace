import { Liveblocks } from '@liveblocks/node'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

function hslFromId(id: string) {
    const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 47 % 360
    return `hsl(${hue}, 65%, 48%)`
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse room ID from Liveblocks request body: { room: "whiteboard-<workspaceId>" }
    const body = await request.clone().json().catch(() => ({} as Record<string, string>))
    const roomId = (body?.room as string) ?? ''
    // Extract workspaceId from "whiteboard-<workspaceId>"
    const workspaceId = roomId.startsWith('whiteboard-') ? roomId.slice('whiteboard-'.length) : null

    const [profileResult, membershipResult] = await Promise.all([
        (supabase.from('profiles') as any)
            .select('first_name, last_name, username, avatar_url')
            .eq('id', user.id)
            .maybeSingle(),
        workspaceId
            ? (supabase.from('workspace_members') as any)
                .select('role')
                .eq('workspace_id', workspaceId)
                .eq('user_id', user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
    ])

    const profile = profileResult.data
    const name = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          || profile.username
          || user.email
          || 'Anonymous'
        : user.email || 'Anonymous'

    const userRole: string = membershipResult.data?.role ?? 'viewer'

    const session = liveblocks.prepareSession(user.id, {
        userInfo: {
            name,
            avatar: profile?.avatar_url ?? null,
            color: hslFromId(user.id),
            role: userRole,
        },
    })

    if (roomId) {
        // RBAC enforced at Liveblocks level — viewers get read-only access to the room
        const access = userRole === 'viewer' ? session.READ_ACCESS : session.FULL_ACCESS
        session.allow(roomId, access)
    } else {
        // Fallback: allow all rooms for the current user
        session.allow('*', session.FULL_ACCESS)
    }

    const { body: responseBody, status } = await session.authorize()
    return new Response(responseBody, { status })
}

