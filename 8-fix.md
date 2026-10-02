We are completely dropping the custom Supabase Broadcast real-time sync for the `tldraw` whiteboard because it is causing infinite loops and sync collisions. 

Instead, we are migrating to **Liveblocks** for flawless multiplayer syncing. 

Please provide the step-by-step instructions and code for the following:

### 1. Package Installation
List the exact `npm install` command needed for Liveblocks and Yjs (e.g., `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/node`, `yjs`, `@liveblocks/yjs`).

### 2. Next.js App Router Auth Route
Create a Liveblocks authentication endpoint at `app/api/liveblocks-auth/route.ts`. 
- It must check the active Supabase session (using our existing Supabase server client).
- If authenticated, it should authorize the user with Liveblocks using `@liveblocks/node`.
- Pass the user's name and avatar (from their Supabase profile) into the `userInfo` so their live cursors are labeled correctly on the canvas.

### 3. Rewrite `components/whiteboard.tsx`
Rewrite the whiteboard component to use Liveblocks.
- Wrap the canvas in `<LiveblocksProvider authEndpoint="/api/liveblocks-auth">` and `<RoomProvider id={workspaceId}>` (use the active workspace ID as the room ID so each workspace gets its own private board).
- Use `useRoom` and Yjs (`@liveblocks/yjs`) to bind the Liveblocks room state to the `tldraw` store.
- **RBAC Check**: We still need to enforce our permissions. If the user's role in this workspace is `viewer`, pass `isReadonly={true}` to the tldraw component so they can watch teammates draw but cannot edit the board themselves.

Please provide the fully updated code for the API route and the new `whiteboard.tsx` component.