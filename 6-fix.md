The infinite loop is fixed, but I am seeing a new warning in the console:
`Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.`

This means our `tldraw` component is trying to broadcast changes (via `store.listen`) before the Supabase WebSocket channel has fully connected and reached the `SUBSCRIBED` state. 

Please update the `tldraw` synchronization logic in `components/whiteboard.tsx` to prevent this:

1. **Gate the Broadcasts**: Create a state variable (e.g., `isChannelReady`) or check the channel's internal state to ensure it is fully joined.
2. **Wait for SUBSCRIBED**: Only set this ready flag to true inside the `channel.subscribe((status) => { ... })` block when `status === 'SUBSCRIBED'`.
3. **Block Early Sends**: Inside the `store.listen((update) => { ... })` block, add a check so it simply returns and does nothing if the channel is not ready yet.

Please provide the updated `useEffect` or component code that safely gates the `channel.send()` calls.