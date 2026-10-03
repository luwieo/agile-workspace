I am updating the project scope based on your roadmap. Please adjust the plan with these final decisions:

1. **Whiteboard:** We are strictly using Excalidraw and Liveblocks. Remove all Tldraw references.
2. **Member Onboarding (Skip Invites):** Cancel the complex "invitation" system (no pending/accepted statuses). We will just build an "Add Member" modal that instantly adds the user to the workspace. No SQL migrations needed for invites.
3. **Task Ownership:** The task creator is the permanent assignee. It should never be editable by anyone, even owners. Remove the assignee edit UI entirely.
4. **Real-Time Summary:** Cancel the "Avatar Filter" idea. Instead, strictly implement the Supabase Realtime listener so the Workspace Summary stats and members list update instantly across all screens without a hard refresh.

Please confirm you understand these updated constraints, and then provide the exact code to implement the Real-Time Workspace Summary updates as our first step.