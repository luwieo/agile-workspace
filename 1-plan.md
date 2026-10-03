I am handing off the development of a Next.js (App Router) and Supabase application called AgileSpace. Please review the following project context, active bugs, and planned features. 

To ensure we maintain high code quality, we will tackle these step-by-step. Do not write the code for all of these at once. Read the context, acknowledge the plan, and then execute ONLY the "Immediate Action" requested at the bottom.

### TAKE NOTE:
1. DO NOT CREATE CHANGES YET. Create a comprehensive implementation plan for the changes needed. Make an artifact.
2. DO NOT CREATE CHANGES ON THE SUPABASE. If there are needed updates, let me know so I can manually query.
3. Analyze the entire codebase before proceeding with the plan. Ask questions if needed for a proper execution.

### 1. Project Context & Architecture
* **Stack:** Next.js (App Router), Supabase (Auth & Postgres), Vercel.
* **Whiteboard Engine:** Tldraw v5 synced via Liveblocks (`@liveblocks/react`, `@liveblocks/yjs`, `yjs`).
* **Design Pattern:** Server Actions for database mutations, Client Components for interactive UI (Kanban, Whiteboard).
* **Current Status:** The core whiteboard is rendering and connecting to Liveblocks. Basic Kanban functionality is deployed.

### 2. Active Bugs to Resolve
* **Whiteboard CRDT Deletion Sync:** When two users are in the Liveblocks room, deleting a Tldraw shape fails; the second user's Yjs state re-broadcasts the deleted shape. Deletion works when a user is alone. The Tldraw store listener needs to explicitly pass `delete` events to the Yjs `Y.Map` transaction block.
* **Stale Workspace Summary UI:** Changing a user's role in the workspace members list does not automatically update on other clients. We need a Supabase Realtime listener on the `workspace_members` table that triggers `router.refresh()` to silently update the UI.

### 3. Planned Enhancements (UI/UX)
* **Live Cursors:** Integrate the Liveblocks presence API into the Tldraw canvas to show Figma-style live cursors with user nametags.
* **Automated Task Ownership:** Remove manual "Assignee" selection from the task creation form. The system must automatically assign `assignee_id` to `auth.uid()` via the Next.js Server Action.
* **Kanban Avatar Filtering:** Add a row of user avatars above the Kanban board. Clicking an avatar updates the URL search parameters (e.g., `?assignee=uuid`), which the board reads to filter tasks.

### 4. New Feature: Workspace Onboarding & Modal
* **Empty State Dashboard:** If a user has no active workspaces, show a clean, blank dashboard with an "Add Workspace" button in the upper right.
* **Creation Flow:** Clicking the button triggers a centralized pop-up modal containing "Workspace Name" (Text) and "Invite Members" (Email/Multi-select).
* **Action:** Submitting the modal creates the workspace via Server Action and triggers the new invitation flow.

### 5. New Feature: Invitation & Notification System
* **Required Data Schema Update:** Update `workspace_members` (or create an `invites` table) to include an `invite_status` column (`pending`, `accepted`, `rejected`).
* **Notification UI:** Add a notification bell or section for users to view `pending` invites. Users must explicitly click "Accept" or "Reject" to gain access.

---

### Immediate Action Request
Please acknowledge this roadmap. Then, for our first technical step, provide the exact **Supabase SQL migration code** required to update our database schema for the new **Invitation System** (adding `invite_status`, handling RLS policies for pending invites, and any necessary trigger functions). Do not write the React UI code yet.

---

### Current Database Schema of the System
[
  {
    "table_name": "card_votes",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "card_votes",
    "column_name": "card_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "card_votes",
    "column_name": "session_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "card_votes",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "card_votes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "comments",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "comments",
    "column_name": "content",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "comments",
    "column_name": "task_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comments",
    "column_name": "author_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "comments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "profiles",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "avatar_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "profiles",
    "column_name": "first_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "middle_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "last_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "username",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projects",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "projects",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "projects",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projects",
    "column_name": "workspace_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projects",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "projects",
    "column_name": "whiteboard_data",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'[]'::jsonb"
  },
  {
    "table_name": "retro_cards",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "retro_cards",
    "column_name": "session_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "retro_cards",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "retro_cards",
    "column_name": "column_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retro_cards",
    "column_name": "content",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retro_cards",
    "column_name": "position",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "retro_cards",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "retro_sessions",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "retro_sessions",
    "column_name": "workspace_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "retro_sessions",
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "retro_sessions",
    "column_name": "phase",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'think'::retro_phase"
  },
  {
    "table_name": "retro_sessions",
    "column_name": "is_locked",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "retro_sessions",
    "column_name": "max_votes_per_user",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "5"
  },
  {
    "table_name": "retro_sessions",
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "retro_sessions",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "tasks",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "tasks",
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "tasks",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tasks",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'backlog'::task_status"
  },
  {
    "table_name": "tasks",
    "column_name": "priority",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'medium'::task_priority"
  },
  {
    "table_name": "tasks",
    "column_name": "project_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tasks",
    "column_name": "assignee_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "tasks",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "tasks",
    "column_name": "tags",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": "'{}'::text[]"
  },
  {
    "table_name": "tasks",
    "column_name": "due_date",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspace_members",
    "column_name": "workspace_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "workspace_members",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "workspace_members",
    "column_name": "role",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'developer'::workspace_role"
  },
  {
    "table_name": "workspace_members",
    "column_name": "joined_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "workspaces",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "workspaces",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "column_name": "slug",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "column_name": "owner_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "workspaces",
    "column_name": "tags",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": "'{}'::text[]"
  }
]