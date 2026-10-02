I am building a Next.js (App Router) SaaS application using Tailwind CSS. We have already established the database schema, Supabase authentication, and server actions. 

I need you to refactor the Tailwind CSS classes of my existing UI components to match a new design system. 

CRITICAL CONSTRAINTS:
1. DO NOT change any of the existing Supabase logic, server actions, or database schema. If there are updates needed, list it down so I can see first then we'll discuss.
2. DO NOT add any new features or data fetching. 
3. Only update the visual Tailwind classes, HTML structure for layout purposes, and standard UI interactivity.
4. Analyze the current codebase before making any changes. Create an implementation plan for me to review first.

CURRENT FEATURES TO STYLE:
1. Similar with Jira and Notion. Sidebar navigation can be customized according to what the user wants to see on their sidebar.
2. Profile can be edited. It can be located on the lower right at the sidebar before the "Sign Out". Ensure that there is a divider between the two. The profile shows the profile picture of user (or profile image placeholder) and their username '@username'.
3. The Workspace would show the workspaces user has access to. It can be filtered as 'all', 'owned', 'shared with me'. It also has a search to find any workspace the user has access to.
4. Inside the workspace, has the board of their tasks (which what we currently have). When adding a task, I want a pop up modal instead of just typing the task then adding. I want the pop up modal to have the following information needed for a task: Task Name (Title), Assignee (automatically shows the username, not editable), Priority, Tags (Nullable), Description (Nullable).
5. I want to see the team-members on the upper left side of the screen. It can show as an avatar-group of the team-members. If the user hovers it, it will show a pop up modal that shows the full detailed-profile of the team-members with their role. Not clickable per member though.
6. Add a summary for the workspace, similar with the one on jira. Below the sprint name, it shows tabs of Summary, Board, Backlog, Timeline.
7. Board should show the tasks. It should also show a filter of priority, tags. Also has search option.
8. Tasks should have a deadline per task since it is a sprint. Tasks set deadline cannot be before the date it was set.

Please provide the updated Next.js (React) code for the Auth pages and Dashboard layout incorporating this new Teal/Navy light theme. I will provide my current code in the next prompt.

DATABASE SCHEMA ALIGNMENT NOTE:
- `tasks` does not currently possess a `due_date` / `deadline` column. Mock this UI state or state the SQL migration needed.
- All workspace filtering ('owned' vs 'shared') must use existing fields (`workspaces.owner_id` vs `workspace_members.user_id`).

### Database Schema (Supabase / PostgreSQL)

1. `profiles`
   - `id`: uuid (Primary Key, references auth.users)
   - `first_name`: text (NOT NULL)
   - `middle_name`: text (Nullable)
   - `last_name`: text (NOT NULL)
   - `username`: text (Nullable)
   - `email`: text (Nullable)
   - `avatar_url`: text (Nullable)
   - `created_at`: timestamptz

2. `workspaces`
   - `id`: uuid (Primary Key)
   - `name`: text (NOT NULL)
   - `slug`: text (NOT NULL)
   - `owner_id`: uuid (Nullable)
   - `created_at`: timestamptz

3. `workspace_members`
   - `workspace_id`: uuid (Primary Key, references workspaces.id)
   - `user_id`: uuid (Primary Key, references profiles.id)
   - `role`: workspace_role enum (Nullable)
   - `joined_at`: timestamptz

4. `projects`
   - `id`: uuid (Primary Key)
   - `name`: text (NOT NULL)
   - `description`: text (Nullable)
   - `workspace_id`: uuid (references workspaces.id)
   - `created_at`: timestamptz

5. `tasks`
   - `id`: uuid (Primary Key)
   - `title`: text (NOT NULL)
   - `description`: text (Nullable)
   - `status`: task_status enum ('backlog', 'todo', 'in_progress', 'done')
   - `priority`: task_priority enum ('low', 'medium', 'high')
   - `project_id`: uuid (references projects.id)
   - `assignee_id`: uuid (references profiles.id)
   - `tags`: text[] (Array, Nullable)
   - `created_at`: timestamptz

6. `comments`, `retro_sessions`, `retro_cards`, `card_votes`
   - Used for retrospective sessions and task discussions.