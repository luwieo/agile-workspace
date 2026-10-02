The whiteboard component is loading, but its CSS is completely broken. It renders raw text ("To move canvas, hold mouse wheel..."), an unstyled checkbox, and a giant SVG padlock icon that takes up the entire screen.

Please fix `components/whiteboard.tsx` (or `collaborative-canvas.tsx`):

1. **Import the CSS**: Add the required stylesheet import at the very top of the file. 
   - If using tldraw, add: `import '@tldraw/tldraw/tldraw.css'`
   - *(If you used excalidraw or another library, please import its respective CSS).*

2. **Fix Container Dimensions**: The `<Tldraw>` (or canvas) component needs to be wrapped in a container with a strict height and relative positioning for its absolute-positioned UI to render correctly. Wrap the component in a `div` like this:
   ```tsx
   <div className="relative w-full h-[calc(100vh-250px)] min-h-[600px]">
     <Tldraw */ /* props/>
   </div>