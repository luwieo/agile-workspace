I want to implement Role-Based Access Control (RBAC) across our Agile workspace application using Next.js (App Router) and Supabase.

We have four workspace roles defined in `workspace_members.role`:
- `'owner'`
- `'developer'`
- `'member'`
- `'viewer'`

---

### RBAC Permission Matrix & Rules

| Capability / Action | Owner | Developer | Member | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| **View Workspace, Boards, Backlog & Tasks** | Yes | Yes | Yes | Yes |
| **Create Tasks** (`createTask`) | Yes | Yes | Yes | No |
| **Drag & Drop / Reorder Tasks** | Yes | Yes | Yes | No |
| **Edit Task Details** (Title, Desc, Assignee, Priority, Due Date, Tag selection) | Yes | Yes | Yes | No |
| **Delete Tasks** (`deleteTask`) | Yes | Yes | No | No |
| **Manage Custom Workspace Tags** (`updateWorkspaceTags`) | **Yes** | **No** | **No** | **No** |
| **Access Workspace Settings** | Yes | No | No | No |
| **Add / Invite Members** (`addWorkspaceMember`) | Yes | No | No | No |
| **Update Member Roles** (`updateMemberRole`) | Yes | No | No | No |
| **Remove Members** (`removeWorkspaceMember`) | Yes | No | No | No |

---

### Implementation Scope & Instructions

#### 1. Central Helper: `lib/rbac.ts`
Create a centralized helper utility with strict TypeScript typing:
- Define `export type WorkspaceRole = 'owner' | 'developer' | 'member' | 'viewer'`
- Export helper methods:
  - `canManageSettings(role?: WorkspaceRole | null): boolean` (Owner only)
  - `canManageTags(role?: WorkspaceRole | null): boolean` (Owner only)
  - `canDeleteTasks(role?: WorkspaceRole | null): boolean` (Owner and Developer)
  - `canEditTasks(role?: WorkspaceRole | null): boolean` (Owner, Developer, and Member)
  - `isReadOnly(role?: WorkspaceRole | null): boolean` (Viewer)

#### 2. Server Action Guards: `app/(dashboard)/workspace/actions.ts`
In every mutating server action, look up the caller's role for that workspace and enforce permissions before running queries:
- `createTask`: Must verify caller has `canEditTasks`.
- `updateTask`: Must verify caller has `canEditTasks`.
- `deleteTask`: Must verify caller has `canDeleteTasks`. Throws error if role is `member` or `viewer`.
- `updateWorkspaceTags`: Must verify caller has `canManageTags` (strictly `owner`).
- `addWorkspaceMember`, `updateMemberRole`, `removeWorkspaceMember`: Must verify caller has `canManageSettings` (strictly `owner`). Ensure the owner cannot remove themselves or demote their own role.

#### 3. Client UI Adjustments:
- **`kanban/page.tsx`**:
  - Resolve the current user's role in the active workspace and pass `userRole` down to child components.
- **`add-task-button.tsx`**:
  - Hide or disable the "+ New Task" button if `isReadOnly(userRole)` is true.
- **`kanban-board.tsx`**:
  - If `isReadOnly(userRole)` is true, disable drag-and-drop handles/listeners so viewers cannot move cards.
  - In the Task Edit modal/drawer:
    - If user is a `viewer`, render inputs as read-only / disabled.
    - If user is a `member` or `viewer`, hide the "Delete Task" button (only visible to `owner` and `developer`).
- **`sprint-tabs.tsx`**:
  - The "Settings" tab remains strictly visible to `owner`.

Please generate the necessary code for `lib/rbac.ts`, the role enforcement updates in `actions.ts`, and the UI role guards in `kanban-board.tsx` and `kanban/page.tsx`.