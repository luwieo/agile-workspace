I want to upgrade `components/member-avatar-group.tsx` so that it functions like Google Docs live presence indicators. 

### Current Behavior:
Currently, the avatar group is static or only renders the currently logged-in user rather than showing all teammates actively viewing the workspace.

### Target Behavior:
1. **Live Presence (Supabase Presence API)**:
   - When a user loads this workspace/kanban page, they join a Supabase presence channel scoped to the workspace (e.g., `presence:workspace-${workspaceId}`).
   - The client calls `channel.track({ userId, name, username, role, avatarUrl })` to broadcast their current presence.
   - Listen to `presence.on('sync')` (and `join`/`leave`) so the avatar list updates in real-time as users open, close, or focus tabs.
   - Clean up by untracking/removing the channel on component unmount.

2. **UI & Hover Popover**:
   - The avatar group in the header should display overlapping avatar circles of all users **currently online/viewing**.
   - Include a subtle green dot/ring indicating they are live.
   - If more than 4 users are online, show the first 3 avatars plus a `+N` count circle.
   - Hovering over the avatar group should trigger the existing popover modal titled `ACTIVE NOW (count)` showing each online member's avatar, Full Name, `@username`, and role badge.

3. **Constraints**:
   - Keep this entirely client-side using `createClient()` from `@/lib/supabase/client`.
   - Pass the current user's profile (`userId`, `name`, `username`, `role`, `avatarUrl`) and `workspaceId` as props into `MemberAvatarGroup`.
   - Ensure the presence state merges multiple browser tabs/sessions cleanly without showing duplicate entries for the same user ID.

Please provide the updated `components/member-avatar-group.tsx` and any required prop adjustments in `app/(dashboard)/workspace/kanban/page.tsx`.