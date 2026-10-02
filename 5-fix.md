I am getting a massive infinite loop in the console, ending with a browser crash: `Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')`. The console is flooded with `Realtime event received!`, `componentDidUpdate`, and warnings that `Realtime send() is automatically falling back to REST API`.

This is happening because our `tldraw` store synchronization is caught in an infinite broadcast loop. When we receive a remote change from Supabase and apply it to the canvas, the `store.listen` callback fires and broadcasts it right back out to the channel.

Please update the `tldraw` synchronization logic in `components/whiteboard.tsx` to explicitly prevent this loop:

1. **Filter by Source**: Inside the `store.listen((update) => { ... })` function, you MUST check the `update.source`. 
   - Only broadcast the changes if `update.source === 'user'` (meaning the local user drew it).
   - Do NOT broadcast if `update.source === 'remote'` (meaning we just merged it from Supabase).
2. **Set Remote Source on Merge**: When receiving a broadcast from Supabase, ensure we apply it using `store.mergeRemoteChanges(changes)` so `tldraw` knows it came from a remote source and won't trigger another user broadcast.
3. **Debounce/Throttle**: If possible, throttle the pointer movement broadcasts so we aren't overwhelming the Supabase channel with 60 updates per second.

Please provide the corrected `useEffect` hook that sets up the `store.listen` and Supabase channel listeners properly.