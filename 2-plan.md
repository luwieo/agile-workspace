I am building a Next.js (App Router) SaaS application using Tailwind CSS. We have already established the database schema, Supabase authentication, and server actions. 

I need you to refactor the Tailwind CSS classes of my existing UI components to match a new design system. 

CRITICAL CONSTRAINTS:
1. DO NOT change any of the existing Supabase logic, server actions, or database schema. 
2. DO NOT add any new features or data fetching. 
3. Only update the visual Tailwind classes, HTML structure for layout purposes, and standard UI interactivity.
4. Analyze the current codebase before making any changes. Create an implementation plan for me to review first.

CONTEXT & DATABASE CHANGES:
1. `profiles` Table Schema:
   - `first_name` (text, required)
   - `middle_name` (text, optional / nullable)
   - `last_name` (text, required)
   - `username` (text, unique, required)
   - `email` (text, unique, required)
2. Login Requirement: Users can log in using either their username OR their email address along with their password.

FILES TO UPDATE:

1. `app/(auth)/actions.ts`:
   - `signup`: Accept `firstName`, `middleName`, `lastName`, `username`, `email`, and `password`. Pass `first_name`, `middle_name`, `last_name`, and `username` inside `options.data` when invoking `supabase.auth.signUp()`.
   - `login`: Accept `identifier` (which can be either a username or email) and `password`. If `identifier` does not contain an '@', query `profiles` to resolve the associated `email` before executing `supabase.auth.signInWithPassword({ email: resolvedEmail, password })`.

2. `app/(auth)/signup/page.tsx`:
   - Expand the form to include inputs for:
     * First Name (`name="firstName"`, required)
     * Middle Name (`name="middleName"`, optional)
     * Last Name (`name="lastName"`, required)
     * Username (`name="username"`, required)
     * Email (`name="email"`, type="email", required)
     * Password (`name="password"`, type="password", minLength={6}, required)
   - Layout: Organize the name inputs in a clean responsive row/grid.
   - Maintain the established light theme styling: `bg-slate-50` page wrapper, card with `bg-white/70 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl`, Navy button (`bg-[#1e3a5f] text-white hover:bg-[#0d9488]`), and Teal focus rings (`focus:border-teal-500 focus:ring-teal-500`).

3. `app/(auth)/login/page.tsx`:
   - Update the primary credential field to accept either a username or email (`name="identifier"`, placeholder "username or you@example.com").
   - Keep the password field and maintain the matching light Navy/Teal design system.

Please provide the updated code for `app/(auth)/actions.ts`, `app/(auth)/signup/page.tsx`, and `app/(auth)/login/page.tsx`.