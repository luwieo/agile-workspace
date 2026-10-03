Please update the UI layout and features in our workspace components based on the following adjustments:

1. **Remove Header Button:** Remove the "+ Add Member" button that currently sits next to the user avatars in the top Sprint header.
2. **Refactor Settings Tab (Add Member):** In the Workspace Settings tab, completely remove the "INVITE NEW MEMBER" inline form card. Replace it with a clean "Add Member" button that triggers the new direct-add modal. 
3. **Add Workspace Deletion (Danger Zone):** At the very bottom of the Workspace Settings tab, create a new "Danger Zone" section with a red "Delete Workspace" button.
4. **Deletion Confirmation:** Clicking the "Delete Workspace" button must trigger a strict confirmation prompt asking exactly: "Are you sure to delete the workspace permanently?". You can use a native browser `window.confirm` or a custom alert modal for this.
5. **Deletion Action:** Wire the deletion button to a Server Action that deletes the workspace from the Supabase database and safely redirects the user back to the main dashboard (`/workspace`).

Please provide the updated code for the relevant components (like the Header, the Settings tab, and the Server Action).