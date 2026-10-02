I am building a Next.js (App Router) SaaS application using Tailwind CSS. We have already established the database schema, Supabase authentication, and server actions. 

I need you to refactor the Tailwind CSS classes of my existing UI components to match a new design system. 

CRITICAL CONSTRAINTS:
1. DO NOT change any of the existing Supabase logic, server actions, or database schema. 
2. DO NOT add any new features or data fetching. 
3. Only update the visual Tailwind classes, HTML structure for layout purposes, and standard UI interactivity.
4. Analyze the current codebase before making any changes. Create an implementation plan for me to review first.

CURRENT FEATURES TO STYLE:
1. Authentication Pages (/login and /signup): Form layouts with email/password inputs, error states, and submit buttons.
2. Dashboard Layout: A persistent navigation header/sidebar with a "Sign Out" button and user email display.
3. Workspace Dashboard: The main landing area for authenticated users.
4. Component Scaffolding: Base UI elements (buttons, inputs, cards) that will eventually be used for our Kanban and Retrospective features.

THE DESIGN SYSTEM (Light Mode):
Please apply a clean, aesthetic, and slightly cozy visual theme with the following color palette:
* Backgrounds: Soft, warm light colors (e.g., slate-50, gray-50, or clean white) to keep the space feeling open and inviting.
* Primary Text: Deep, readable dark colors (e.g., slate-800 or gray-900).
* Accents & Secondary Colors: 
  - Navy: Use for primary buttons, active states, and strong borders to ground the design.
  - Teal: Use for hover states, subtle highlights, badges, or success indicators to add a vibrant, aesthetic pop.
* Styling Details: Use rounded corners (`rounded-xl` or `rounded-2xl`), soft shadows (`shadow-sm` or `shadow-md`), and glassmorphism/backdrop-blur effects sparingly for the navigation bar or floating modals.

Please provide the updated Next.js (React) code for the Auth pages and Dashboard layout incorporating this new Teal/Navy light theme. I will provide my current code in the next prompt.