# Phased Workflow - Progress Tracker

flowchart TD
    classDef done fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff;
    classDef current fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff;
    classDef upcoming fill:#1f2937,stroke:#4b5563,stroke-width:1px,color:#d1d5db;

    subgraph P1["Phase 1: Data Layer & Security (Completed)"]
        A1["Design Unified 9-Table ERD"] --> A2["Execute Supabase SQL DDL & Enums"]
        A2 --> A3["Apply Workspace-Scoped RLS Policies"]
        A3 --> A4["Setup Auth Triggers & Enable Realtime"]
    end
    class P1,A1,A2,A3,A4 done;

    subgraph P2["Phase 2: Next.js Foundation & Auth (Current)"]
        B1["Install @supabase/ssr & Dependencies"] --> B2["Generate TypeScript Definitions (CLI)"]
        B2 --> B3["Configure Client, Server, & Middleware Helpers"]
        B3 --> B4["Implement /login & /signup Auth Routes"]
        B4 --> B5["Configure Middleware Route Guarding"]
    end
    class P2,B1,B2,B3,B4,B5 current;

    subgraph P3["Phase 3: Workspace & Tenancy UI"]
        C1["Onboarding: First-Time Workspace Setup"] --> C2["Workspace Dashboard (Projects & Retros View)"]
        C2 --> C3["Role Provider: Context/Store for Workspace Roles"]
    end
    class P3,C1,C2,C3 upcoming;

    subgraph P4["Phase 4: Kanban Workspace & Hyper-Focus Mode"]
        D1["Build 4-Column Drag-and-Drop Board"] --> D2["Optimistic UI Updates for Task Transitions"]
        D2 --> D3["Build Hyper-Focus Mode & Pomodoro Integration"]
    end
    class P4,D1,D2,D3 upcoming;

    subgraph P5["Phase 5: The Retrospective Engine"]
        E1["Build Phase Machine Controller (Think ➔ Group ➔ Vote ➔ Action)"] --> E2["Phase-Locked UI (Card Entry, Voting Rules, Aggregation)"]
        E2 --> E3["Convert Action Items to Kanban Tasks"]
    end
    class P5,E1,E2,E3 upcoming;

    subgraph P6["Phase 6: Real-Time Multiplayer"]
        F1["Supabase Realtime: Postgres Changes (Tasks, Votes, Comments)"] --> F2["Supabase Presence: Ephemeral Cursor Broadcasting"]
        F2 --> F3["Multiplayer Cursors UI Rendering"]
    end
    class P6,F1,F2,F3 upcoming;

    subgraph P7["Phase 7: QA & Deployment"]
        G1["Incognito Multi-Role Concurrency & RLS Testing"] --> G2["Deploy Next.js to Vercel"]
        G2 --> G3["Finalize Production CORS & Env Keys"]
    end
    class P7,G1,G2,G3 upcoming;

    %% Inter-phase transitions
    A4 --> B1
    B5 --> C1
    C3 --> D1
    D3 --> E1
    E3 --> F1
    F3 --> G1