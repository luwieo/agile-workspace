In the Workspace Settings tab and Summary view, the Members list only shows the current user (`1 member in this workspace`) even though multiple members exist and are active in the workspace.

Please check and fix `app/(dashboard)/workspace/kanban/page.tsx`:

1. **Query Filter**: Ensure the `workspace_members` query filters strictly by `workspace_id = effectiveWorkspaceId`, NOT `user_id = user.id`:
```typescript
const { data: rawMembers } = await (supabase
  .from('workspace_members') as any)
  .select(`
    user_id,
    role,
    profiles (
      id,
      first_name,
      last_name,
      username,
      avatar_url
    )
  `)
  .eq('workspace_id', effectiveWorkspaceId)