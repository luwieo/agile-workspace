The canvas UI and Liveblocks connection are working, but there is a synchronization issue with deleting shapes:

- When a single user is in the room, deleting shapes works normally.
- When two users are in the same room, whenever one user deletes a stroke/shape, it immediately reappears (or fails to erase), because the second peer's state still holds the record and syncs it back.

This is a CRDT removal sync issue between Tldraw's store and the Yjs `Y.Map`.

Please update `components/whiteboard.tsx` to handle deletions properly:

1. **Explicit Deletion Handling in Store Sync**: When listening to Tldraw store changes via `store.listen`:
   - Ensure that `update.changes.removed` records explicitly call `yMap.delete(recordId)` inside a single `yDoc.transact(() => { ... })` block.
2. **Apply Remote Deletions to Tldraw**: When observing changes on `yMap` (via `yMap.observe` or the Liveblocks/Yjs binding):
   - Whenever an action of type `delete` occurs on a key, ensure `store.remove([deletedKey as any])` is explicitly called inside `store.mergeRemoteChanges(() => { ... })`.
3. **Prevent Self-Echoing Re-adds**: Ensure that when remote deletions are merged, your local store listener doesn't interpret the remote removal as a reason to re-populate the map from the store snapshot.
4. If using a prebuilt hook or library binding (like `@liveblocks/yjs` or a custom store sync hook), verify that the bi-directional binding synchronizes both `set` AND `delete` operations without creating echo loops.

Please provide the corrected sync handler or component code for `components/whiteboard.tsx`.