My Vercel deployment failed with the following Next.js build errors:

1. `app/(dashboard)/workspace/kanban/page.tsx(185,33): error TS2352: Conversion of type 'any[]' to type 'Record<string, unknown>' may be a mistake...`
2. `components/sprint-tabs.tsx: error TS2304: Cannot find name 'Tab'.`

Please fix these TypeScript errors:

**For `sprint-tabs.tsx`:**
The `Tab` type is missing. Please define the `Tab` string union type at the top of the file based on the tabs we have. It should look something like this:
`type Tab = 'Summary' | 'Board' | 'Backlog' | 'Whiteboard' | 'Timeline' | 'Settings';`
(Adjust the exact string values to match whatever state we are using for the active tab).

**For `kanban/page.tsx`:**
At around line 185, there is an invalid type cast where an array is being cast directly to `Record<string, unknown>`. 
To bypass this strict TypeScript error, please change the cast to go through `unknown` first (e.g., `as unknown as Record<string, unknown>`), or correctly type it as an array if that is what the underlying data actually is.

Please provide the corrected snippets for both files so I can push the fixes.