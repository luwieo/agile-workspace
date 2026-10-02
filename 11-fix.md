The Liveblocks canvas is showing a blank white screen, and the console shows a fatal crash: `[Whiteboard] DB save failed: TypeError: s.store.getSnapshot is not a function`. The console also still shows `Realtime status on tasks-shared-channel: SUBSCRIBED`.

This means the old custom Supabase Realtime channel listeners and the old background database auto-save loop (`getSnapshot`) were left inside the `whiteboard.tsx` file. They are conflicting with the new Yjs/Liveblocks store and crashing the render cycle.

Please completely clean up `components/whiteboard.tsx`:
1. **Remove Old Realtime**: Delete the `useEffect` that connects to `supabase.channel(...)`.
2. **Remove Old Auto-Save**: Delete the background auto-save interval/function that is trying to call `store.getSnapshot()` or `s.store.getSnapshot`.
3. **Pure Liveblocks**: Ensure the component *only* uses Liveblocks (`useRoom`, YjsProvider) for state synchronization, completely separate from our old manual Supabase sync.

Please provide the fully cleaned up, working `components/whiteboard.tsx` file.