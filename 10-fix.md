The Liveblocks migration deployed successfully to Vercel, and I can see the "Powered by liveblocks" watermark, but the actual Tldraw canvas is completely blank. 

Please update `components/whiteboard.tsx` to fix the blank screen:

1. **Restore the CSS**: Ensure `import '@tldraw/tldraw/tldraw.css'` is at the very top of the file. If this is missing, the canvas UI becomes completely invisible.
2. **Add a Loading State**: Wrap the main canvas logic inside Liveblocks' `<ClientSideSuspense fallback={<div className="flex items-center justify-center h-full">Loading Whiteboard...</div>}>`. Right now, if Liveblocks is authenticating, it renders a blank screen instead of a loading indicator.
3. **Container Dimensions**: Ensure the wrapper `div` around the Tldraw component has a definitive height (e.g., `className="w-full h-[calc(100vh-250px)] min-h-[600px] relative"`).
4. **Yjs Setup**: Verify that the Yjs provider (`@liveblocks/yjs`) is correctly binding the Liveblocks room to the Tldraw store without throwing silent errors.

Please provide the updated code for `components/whiteboard.tsx`.

My Vercel deployment failed with another TypeScript error on the Tldraw component:
`components/whiteboard.tsx(183,17): error TS2322: Type '{ onMount: Dispatch<any>; isReadonly: boolean; }' is not assignable to type 'IntrinsicAttributes & TldrawProps'. Property 'isReadonly' does not exist...`

This is because in the latest versions of `@tldraw/tldraw`, `isReadonly` is NO LONGER passed as a direct prop to the `<Tldraw>` component. Instead, it is an instance state flag.

Please update `components/whiteboard.tsx` to fix this:

1. **Remove the Prop**: Remove `isReadonly` (or `readOnly`) from the `<Tldraw />` component entirely.
2. **Set State on Mount**: Inside the `onMount` callback (which receives the `editor` instance), set the read-only state using:
   `editor.updateInstanceState({ isReadonly: userRole === 'viewer' })`
3. **Handle Dynamic Changes**: If the user's role might change dynamically, please store the `editor` instance in a React state variable (e.g., `const [editor, setEditor] = useState<Editor | null>(null)`), set it during `onMount`, and use a `useEffect` to watch `userRole` and call `editor?.updateInstanceState({ isReadonly: userRole === 'viewer' })` whenever it updates.

Please provide the corrected `components/whiteboard.tsx` code handling the read-only state correctly using the `updateInstanceState` method.