The Liveblocks migration deployed successfully to Vercel, and I can see the "Powered by liveblocks" watermark, but the actual Tldraw canvas is completely blank. 

Please update `components/whiteboard.tsx` to fix the blank screen:

1. **Restore the CSS**: Ensure `import '@tldraw/tldraw/tldraw.css'` is at the very top of the file. If this is missing, the canvas UI becomes completely invisible.
2. **Add a Loading State**: Wrap the main canvas logic inside Liveblocks' `<ClientSideSuspense fallback={<div className="flex items-center justify-center h-full">Loading Whiteboard...</div>}>`. Right now, if Liveblocks is authenticating, it renders a blank screen instead of a loading indicator.
3. **Container Dimensions**: Ensure the wrapper `div` around the Tldraw component has a definitive height (e.g., `className="w-full h-[calc(100vh-250px)] min-h-[600px] relative"`).
4. **Yjs Setup**: Verify that the Yjs provider (`@liveblocks/yjs`) is correctly binding the Liveblocks room to the Tldraw store without throwing silent errors.

Please provide the updated code for `components/whiteboard.tsx`.