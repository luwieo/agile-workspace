I am getting a Next.js runtime error in `components/whiteboard.tsx` at line 94:
`Runtime Error: tried to join multiple times. 'join' can only be called a single time per channel instance`

This is happening because React Strict Mode runs the `useEffect` twice in development, and the Supabase Realtime channel is not being cleaned up, causing `.subscribe()` to be called twice on the same channel.

Please update the `useEffect` block in `components/whiteboard.tsx` that handles the Supabase channel subscription to include a proper cleanup function. 

It should look something like this:

```typescript
useEffect(() => {
  const ch = supabase.channel(`whiteboard:${projectId}`)
  
  ch.on('broadcast', { event: 'cursor-move' }, (payload) => { /* ... */ })
    .on('broadcast', { event: 'canvas-update' }, (payload) => { /* ... */ })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        ch.track({ userId: currentUser.id, name: currentUser.name })
      }
    })

  // Add this cleanup function
  return () => {
    supabase.removeChannel(ch)
  }
}, [projectId, currentUser, supabase])