# AgileSpace — Technical Documentation & Architecture Guide

> **Version:** 0.1.0 · **Framework:** Next.js 16.3.8 (App Router) · **Last Updated:** October 2026

---

## Table of Contents

1. [System Architecture & Tech Stack](#1-system-architecture--tech-stack)
2. [Project Structure](#2-project-structure)
3. [Core Features Overview](#3-core-features-overview)
4. [Role-Based Access Control (RBAC) & Data Ownership](#4-role-based-access-control-rbac--data-ownership)
5. [Real-Time Infrastructure](#5-real-time-infrastructure)
6. [Database Schema](#6-database-schema)
7. [Server Actions Reference](#7-server-actions-reference)

---

## 1. System Architecture & Tech Stack

AgileSpace is a collaborative agile project management platform built on a **Next.js App Router** architecture with three primary infrastructure layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser Client                          │
│  React 19 / Next.js 16 Client Components (Kanban, Whiteboard)   │
└──────────────────────┬────────────────────────┬─────────────────┘
                       │                        │
           ┌───────────▼──────────┐   ┌─────────▼──────────────┐
           │   Supabase           │   │   Liveblocks            │
           │   • Postgres DB      │   │   • WebSocket Rooms     │
           │   • Auth (JWT/SSR)   │   │   • Broadcast Events    │
           │   • Realtime WS      │   │   • Presence API        │
           │   • Row Level Security│   └────────────────────────┘
           └───────────┬──────────┘
                       │
           ┌───────────▼──────────┐
           │   Next.js Server     │
           │   • Server Actions   │
           │   • Server Components│
           │   • SSR Data Fetching│
           └──────────────────────┘
```

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.3.8 | App Router, SSR, Server Actions |
| **React** | 19.2.8 | UI rendering |
| **Tailwind CSS** | ^4 | Utility-first styling |
| **TypeScript** | ^5 | Type safety |

### Backend / Database

| Technology | Version | Purpose |
|---|---|---|
| **Supabase JS** | ^2.117.2 | Postgres client, Auth, Realtime |
| **@supabase/ssr** | ^0.12.7 | Server-side session handling with cookie management |

### Multiplayer / Real-Time Engine

| Technology | Version | Purpose |
|---|---|---|
| **@liveblocks/react** | ^3.24.3 | React hooks for rooms, presence, and broadcast |
| **@liveblocks/node** | ^3.24.3 | Server-side auth endpoint |
| **@excalidraw/excalidraw** | ^0.18.1 | Collaborative drawing canvas |

---

## 2. Project Structure

```
agile-workspace/
├── app/
│   ├── (auth)/                    # Login / Signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   └── workspace/
│   │       ├── actions.ts         # All Server Actions (mutations)
│   │       ├── layout.tsx         # Workspace shell + sidebar
│   │       ├── page.tsx           # Dashboard / workspace list
│   │       ├── kanban/            # Sprint board
│   │       │   ├── page.tsx       # Server component (data fetching)
│   │       │   ├── kanban-board.tsx  # Client: drag-and-drop board
│   │       │   ├── add-task-button.tsx # Client: task creation modal
│   │       │   └── add-task-button.tsx
│   │       └── backlog/           # Project backlog view
│   └── api/
│       └── liveblocks-auth/       # Liveblocks JWT endpoint
│           └── route.ts
├── components/
│   ├── sprint-tabs.tsx            # Tab navigation (Summary, Board, Whiteboard, Settings)
│   ├── whiteboard.tsx             # Excalidraw + Liveblocks canvas
│   ├── add-member-button.tsx      # Direct-add member modal
│   ├── create-workspace-button.tsx # Workspace creation modal
│   ├── member-avatar-group.tsx    # Avatar stack with realtime presence
│   └── workspace-list.tsx        # Workspace card grid
├── lib/
│   ├── rbac.ts                    # Role definitions and permission helpers
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   └── server.ts              # Server Supabase client (SSR cookies)
│   └── hooks/
│       └── use-workspace-realtime.ts # Supabase Realtime subscription hook
└── package.json
```

---

## 3. Core Features Overview

### 3.1 Workspace Management

Workspaces are the top-level organisational unit. Each workspace contains one or more **Projects** (Sprint boards), with members assigned roles that control their access.

**Create Workspace Flow:**
1. User clicks "**+ Add Workspace**" button (in dashboard header, both empty and populated states).
2. A native `<dialog>` modal opens prompting for the **Workspace Name**.
3. On submit, the `createWorkspace` Server Action:
   - Generates a URL-safe slug with a 5-character random suffix (prevents collisions).
   - Inserts the workspace row.
   - Inserts the creator into `workspace_members` with `role: 'owner'`.
   - Creates a default **Sprint 1** project.
   - Revalidates the workspace layout cache.

**Add Member Flow (Direct, No Invitation Queue):**
- Owner clicks "**Add Member**" in the Settings tab.
- The `AddMemberButton` modal prompts for **email** and **role**.
- The `addWorkspaceMember` Server Action:
  - Validates the caller is `owner` (RBAC guard).
  - Looks up the target user's profile by email (`ilike` for case-insensitivity).
  - Checks for duplicate membership.
  - Inserts the new `workspace_members` row immediately (no pending state).
- Access is granted **instantly** — no invitation acceptance required.

**Danger Zone — Workspace Deletion:**
- Available only to the **Owner** in the Settings tab.
- Clicking "**Delete Workspace**" triggers a strict browser confirmation:
  > *"Are you sure to delete the workspace permanently?"*
- On confirmation, the `deleteWorkspace` Server Action:
  - Re-validates caller is `owner`.
  - Deletes the workspace row (cascades to related records via FK constraints).
  - Calls `redirect('/workspace')` to navigate the owner back to the dashboard.

---

### 3.2 Kanban Board

The Kanban board is the primary task management interface, rendered inside the **Board** tab of `SprintTabs`.

**Columns:** `To Do` · `In Progress` · `Done`

**Task Creation:**
- The "**Add Task**" button (top right header, hidden for Viewers) opens a `<dialog>` modal.
- Fields: **Title** (required), **Priority** (`low`/`medium`/`high`), **Status**, **Tags** (chip multi-select from workspace tags), **Description**, **Due Date**.
- On submit, `createTask` Server Action:
  - Verifies the caller has `canEditTasks` permission.
  - Sets `assignee_id: user.id` (the creator). This is **permanent and non-editable**.
  - Inserts the task and revalidates both `/workspace/kanban` and `/workspace/backlog`.

**Drag and Drop:**
- Implemented via native HTML5 drag-and-drop events (`dragstart`, `dragover`, `drop`).
- Dropping a card onto a column calls `updateTaskStatus` Server Action optimistically.

**Task Detail Modal:**
- Click any card to open a full-detail modal.
- Owners and Developers can edit title, description, priority, tags, and due date.
- The assignee field is **read-only** for all roles — it displays the creator's name, never allows editing.
- Delete button visible only to `owner` and `developer`.

**Tags:**
- Workspace-scoped custom tags configured by the Owner in Settings.
- Displayed as coloured chip badges on task cards.

---

### 3.3 Collaborative Whiteboard

Each workspace project includes a shared whiteboard, accessible via the **Whiteboard** tab. It is built on [Excalidraw](https://excalidraw.com/) with Liveblocks for real-time multi-user sync.

**Key behaviours:**
- Viewers see a "View only" banner; canvas is locked (`viewModeEnabled: true`).
- All other roles can draw freely.
- Changes are broadcast to peers in real-time via Liveblocks events.
- The scene is silently persisted to the `projects.whiteboard_data` Postgres column with a **2-second debounce** after each change.
- Late-joining users load the last saved snapshot from the DB as `initialData`.

See [§5.2](#52-liveblocks-sync--excalidraw-whiteboard) for the full real-time sync architecture.

---

## 4. Role-Based Access Control (RBAC) & Data Ownership

### 4.1 Role Definitions

Roles are defined in [`lib/rbac.ts`](./lib/rbac.ts) and enforced in every Server Action.

| Role | Hierarchy | Capabilities |
|---|---|---|
| **Owner** | 4 (highest) | All actions: manage settings, custom tags, add/remove members, change roles, delete workspace, create/edit/delete tasks, draw on whiteboard |
| **Developer** | 3 | Create, edit, and **delete** tasks; draw on whiteboard |
| **Member** | 2 | Create and edit tasks; draw on whiteboard. **Cannot delete** tasks |
| **Viewer** | 1 (lowest) | Read-only access to all views. Cannot create, edit, or delete tasks. Whiteboard is locked to view-only |

### 4.2 Permission Helper Functions

```typescript
// lib/rbac.ts

canManageSettings(role)  // → true only for 'owner'
canManageTags(role)      // → true only for 'owner'
canDeleteTasks(role)     // → true for 'owner' | 'developer'
canEditTasks(role)       // → true for 'owner' | 'developer' | 'member' (hierarchy >= 2)
isReadOnly(role)         // → true for 'viewer'
```

Every Server Action that mutates data fetches the caller's `workspace_members.role` from the database and runs the appropriate guard **before** executing the mutation. This means RBAC is enforced server-side, not just in the UI.

### 4.3 Task Ownership — Strict Creator-as-Assignee Rule

> **Rule:** The task creator is the **permanent and exclusive** assignee. This field can never be changed by any user, regardless of role.

**Enforcement points:**

1. **Server Action (`createTask`):** `assignee_id` is always set to `user.id` (the authenticated caller). The form's `assigneeId` field is completely ignored server-side.
2. **UI (`add-task-button.tsx`):** No assignee selector is rendered in the task creation form.
3. **UI (`kanban-board.tsx`):** The task detail modal displays the assignee name as **read-only text**. No `<select>` or edit control is rendered for any role.
4. **Server Action (`updateTask`):** Does not accept or process an `assigneeId` field.

---

## 5. Real-Time Infrastructure

### 5.1 Supabase Realtime — Workspace & Task Sync

The `useWorkspaceRealtime` hook ([`lib/hooks/use-workspace-realtime.ts`](./lib/hooks/use-workspace-realtime.ts)) is mounted inside `SprintTabs` and provides **silent, automatic UI refresh** whenever the workspace or its tasks change on any connected client.

**How it works:**

```typescript
// lib/hooks/use-workspace-realtime.ts

const channel = supabase
    .channel(`workspace-live:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, handler)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handler)
    .subscribe()
```

1. A **single Supabase channel** subscribes to `postgres_changes` events on two tables:
   - `workspace_members` — fires on member add, role change, or removal.
   - `tasks` — fires on task create, update (status drag, field edit), or delete.
2. The handler client-side **filters events** by `workspace_id` / `project_id` to ignore changes from other workspaces.
3. When a relevant event arrives, `router.refresh()` is called with a **250ms debounce** to coalesce rapid consecutive changes (e.g., dragging multiple cards) into a single re-render.
4. `router.refresh()` triggers Next.js App Router to re-fetch all Server Components in the current route — the Summary stats, member lists, and task counts update **without a full page reload**.

**Required Database Configuration:**

For `DELETE` events to carry the `workspace_id`/`project_id` columns in the payload (not just the row `id`), both tables must be configured with:

```sql
ALTER TABLE public.workspace_members REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
```

Without `REPLICA IDENTITY FULL`, delete payloads only contain the primary key, making workspace/project filtering impossible.

---

### 5.2 Liveblocks Sync — Excalidraw Whiteboard

The whiteboard ([`components/whiteboard.tsx`](./components/whiteboard.tsx)) uses Liveblocks **Broadcast Events** for peer-to-peer scene sync and the **Presence API** for live cursors.

#### Room Architecture

Each workspace project gets its own Liveblocks room:

```
Room ID: `whiteboard-${workspaceId}`
```

The room is created by wrapping the Excalidraw canvas in `<RoomProvider>`. Authentication is handled by the `/api/liveblocks-auth` endpoint, which validates the Supabase session and issues a Liveblocks JWT with the user's `name`, `avatar`, and `color` embedded as `userInfo`.

#### CRDT Sync — Broadcast + reconcileElements

Excalidraw's `onChange` callback fires on every local scene change. The sync pipeline is:

```
Local draw/delete
      │
      ▼
getSceneVersion(elements)   ← compare to lastBroadcastVersionRef
      │  (skip if unchanged — prevents selection-only broadcasts)
      ▼
broadcast({ type: 'elements-update', elements: [...elements] })
      │
      ▼  (received by all other clients via useEventListener)
reconcileElements(localElements, remoteElements, appState)
      │  ← uses Excalidraw's built-in CRDT merge algorithm
      ▼
updateScene({ elements: merged, captureUpdate: 2 })
```

**Deletion Tombstone Handling:**

The most critical detail is the use of `getSceneElementsIncludingDeleted()` (not `getSceneElements()`) when building the local side for `reconcileElements`. This ensures **soft-deleted elements (tombstones)** are included in the merge:

- When user A deletes a shape, Excalidraw marks it `isDeleted: true` with a bumped `version`.
- This tombstoned element is broadcast to user B.
- User B's `reconcileElements` sees the higher version for that element ID and preserves `isDeleted: true`.
- Without tombstones, user B's stale non-deleted version would "win" the merge and the shape would reappear.

**Echo Prevention:**

To prevent a remote `updateScene()` call from triggering a local `onChange → broadcast` loop, an `isRemoteUpdateRef` flag is set to `true` immediately before calling `updateScene`. The `onChange` handler checks this flag first and returns early if set, then resets it to `false`.

**Undo/Redo Safety:**

Remote scene updates use `captureUpdate: 2` (`CaptureUpdateAction.NEVER`), preventing them from being pushed onto the local undo/redo stack. Only the user's own drawing actions participate in their local history.

#### Live Cursors & Nametags

```
onPointerUpdate  →  updateMyPresence({ cursor: {x, y}, button })
onPointerLeave   →  updateMyPresence({ cursor: null })

useOthers()      →  Map<connectionId, { cursor, username, color }>
                 →  excalidrawApi.updateScene({ collaborators })
```

Excalidraw natively renders the `collaborators` map as Figma-style cursor labels. User `name` and `color` are sourced from the Liveblocks `userInfo` field set during JWT auth — no additional state management is needed.

---

## 6. Database Schema

### Core Tables

| Table | Primary Key | Key Columns |
|---|---|---|
| `profiles` | `id` (uuid) | `first_name`, `last_name`, `username`, `email`, `avatar_url` |
| `workspaces` | `id` (uuid) | `name`, `slug`, `owner_id`, `tags` (text[]) |
| `workspace_members` | `(workspace_id, user_id)` | `role` (workspace_role enum), `joined_at` |
| `projects` | `id` (uuid) | `name`, `workspace_id`, `whiteboard_data` (jsonb) |
| `tasks` | `id` (uuid) | `title`, `status`, `priority`, `assignee_id`, `project_id`, `tags`, `due_date` |

### Enums

```sql
workspace_role: 'owner' | 'developer' | 'member' | 'viewer'
task_status:    'backlog' | 'todo' | 'in_progress' | 'done'
task_priority:  'low' | 'medium' | 'high'
```

### Key Relationships

```
workspaces  ──< workspace_members >── profiles (auth.users)
workspaces  ──< projects
projects    ──< tasks
tasks.assignee_id ──> profiles
```

> **Note:** `workspace_members` uses a **composite primary key** `(workspace_id, user_id)` — there is no standalone `id` column. Any query selecting members must use `select('user_id')` or `select('role')`, not `select('id')`.

---

## 7. Server Actions Reference

All mutations live in [`app/(dashboard)/workspace/actions.ts`](./app/(dashboard)/workspace/actions.ts). Every action:

1. Authenticates via `supabase.auth.getUser()`.
2. Fetches the caller's `workspace_members.role` and runs an RBAC guard.
3. Performs the mutation.
4. Calls `revalidatePath()` to bust Next.js cache.

| Action | Guard | Effect |
|---|---|---|
| `createWorkspace(formData)` | authenticated | Create workspace + owner member + Sprint 1 project |
| `createTask(formData)` | `canEditTasks` | Insert task; `assignee_id` forced to caller's `user.id` |
| `updateTaskStatus(taskId, status)` | — | Move task between columns |
| `updateTask(formData)` | `canEditTasks` | Edit title, description, priority, tags, due date |
| `deleteTask(taskId)` | `canDeleteTasks` | Hard delete task |
| `addWorkspaceMember(formData)` | `canManageSettings` (owner) | Look up user by email; insert into `workspace_members` |
| `removeWorkspaceMember(formData)` | owner only | Delete member row; cannot remove self |
| `updateMemberRole(formData)` | owner only | Change a member's role; cannot change own role |
| `updateWorkspaceTags(formData)` | `canManageTags` (owner) | Replace workspace `tags` array |
| `saveWhiteboard(formData)` | `canEditTasks` | Upsert `projects.whiteboard_data` (jsonb) |
| `deleteWorkspace(workspaceId)` | owner only | Delete workspace row; redirect to `/workspace` |
| `updateProfile(formData)` | authenticated | Update `profiles` row for current user |

---

*Built with ❤️ by the AgileSpace team.*
