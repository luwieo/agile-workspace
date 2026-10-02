I want to implement **Workspace Settings (Custom Task Tags & Member Management)** and a **Read-Only Workspace Summary** for our Next.js (App Router) + Supabase application.

Create an implementation plan first. Do not create changes yet.

---

### Database Schema Context
Current tables and fields:
- `workspaces`: `id`, `name`, `slug`, `owner_id`, `created_at`
- `workspace_members`: `workspace_id`, `user_id`, `role` (`'owner' | 'developer' | 'member' | 'viewer'`), `joined_at`
- `tasks`: `id`, `title`, `description`, `status`, `priority`, `project_id`, `assignee_id`, `tags` (`text[]`), `due_date`, `created_at`
- `profiles`: `id`, `first_name`, `middle_name`, `last_name`, `username`, `email`, `avatar_url`

**Required Database Migration**:
Since `workspaces` does not have a tags column to store the owner's configured tags, please assume I will run:
```sql
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';