Our `tldraw` whiteboard is experiencing severe sync collisions. Shapes disappear and reappear (ghosting), and when one user draws, the other gets locked out of drawing. 

This is happening because we are either broadcasting full store snapshots instead of deltas, or our database auto-save is constantly re-fetching and overwriting the local live state.

Please rewrite the synchronization logic in `components/whiteboard.tsx` following these strict CRDT/multiplayer principles:

1. **Strictly Initial Load Only**: Fetch the `whiteboard_data` from the `projects` table exactly ONCE on mount. Initialize the store with it, and **never re-fetch or re-apply it** to the canvas. 
2. **Broadcast Deltas Only**: Inside `store.listen`, extract only the specific changed records. Broadcast an object containing `{ added, updated, removed }` from `update.changes`. Do NOT broadcast the entire store.
3. **Merge Deltas Safely**: When receiving a broadcast from a teammate, apply it using `store.mergeRemoteChanges(() => { ... })`. Inside that callback, strictly use `store.put()` for added/updated records and `store.remove()` for removed records.
4. **Silent Background Auto-Save**: The database auto-save should simply grab `store.getSnapshot()` and send it to the server action every few seconds. It must NOT alter the local store or trigger a re-render when the save completes.
5. **Role Lock Check**: Ensure `isReadonly` is strictly tied to the user's RBAC role (e.g., `isReadonly={userRole === 'viewer'}`), and that incoming broadcasts do not accidentally flip this prop or lock the UI.

Please provide the fully updated component code applying these fixes.