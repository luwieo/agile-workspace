I want to add a **Live Collaborative Whiteboard** to our Next.js (App Router) + Supabase application, similar to Figma/FigJam. 

We will add this as a new "Whiteboard" tab inside our existing `sprint-tabs.tsx` component. 

### 1. Technology Stack & Library
- Use `@tldraw/tldraw` (or `@excalidraw/excalidraw` if it's easier to wire up with Supabase Realtime). 
- The canvas component must be loaded dynamically (`next/dynamic` with `ssr: false`) to prevent server-side hydration errors.

### 2. Database & Persistence
- We will store the whiteboard snapshot on the `projects` table. Assume I will run this migration:
  ```sql
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS whiteboard_data jsonb DEFAULT '[]'::jsonb;