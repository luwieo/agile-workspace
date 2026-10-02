The implementation plan looks great. Let's proceed with execution following your steps. 

Here are the answers to the Open Questions:

1. **`workspace_role` Enum**:
   - The verified database enum values are: `'owner'`, `'developer'`, `'member'`, `'viewer'`. Please use these values for any role checks or dropdowns.

2. **`updateProfile` Action**:
   - For now, keep it simple with just text fields (`first_name`, `middle_name`(nullable), `last_name`, `username`, `avatar_url` as an image URL string). No Supabase Storage bucket needed at this stage.

3. **`due_date` Migration**:
   - Confirmed. The `ALTER TABLE public.tasks ADD COLUMN due_date date NULL;` query has already been executed in the Supabase SQL editor. Please wire up the persistence directly in `createTask` and `updateTask` (handling `due_date`).

4. **Timeline Tab**:
   - Keep the Timeline tab as a visual placeholder/stub ("Coming Soon" with a stylized roadmap preview) for now so we don't introduce unnecessary charting dependencies.

Please generate the code starting with **Steps 1–3**:
1. `app/(dashboard)/workspace/layout.tsx` (profile fetching)
2. `components/workspace-sidebar.tsx` (profile section, edit dialog, fixed sign-out)
3. The `updateProfile` server action in `app/(dashboard)/workspace/actions.ts`