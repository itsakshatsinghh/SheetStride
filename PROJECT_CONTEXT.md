# Project Memory: PROJECT_CONTEXT.md (Unified AI Context Sheet)

This document is a compressed, high-signal summary of SheetStride. It provides a complete transfer of project context to future AI assistants, enabling them to understand 80–90% of the codebase's mechanics, dependencies, and structure in a single reading.

---

## 1. Product Overview & Vision
*   **Project Name:** SheetStride
*   **Target Users:** Software engineers preparing for interviews at FAANG, high-frequency trading (HFT) companies, SaaS corporations, and scaling startups.
*   **Core Value Proposition:** Transitioning users away from rote LeetCode grinding to algorithmic pattern recognition. Instead of solving random problems, developers study core blueprints (e.g., Sliding Window, Fast & Slow Pointers, Backtracking) and practice them across curated curriculum roadmaps.
*   **Visual Style:** Premium dark-themed cyberpunk aesthetic featuring:
    *   Glassmorphism card elements with glowing borders.
    *   Rich SVG-based charts (weekly throughput bar charts, radial gauges, and contributions heatmap grid).
    *   Dynamic terminal-style homepage HUD.
    *   Micro-animations powered by Framer Motion.

---

## 2. Technology Stack & Configuration
SheetStride uses a modern, lightweight tech stack compiled under strict TypeScript constraints:
*   **Core Framework:** Next.js (v15.0.3) utilizing the App Router framework.
*   **Library Core:** React (v18.3.1) and TypeScript (v5.6.3).
*   **Design System:** Tailwind CSS (v3.4.15) with custom theme color tokens configured in `tailwind.config.ts` and mapping directly to CSS variables inside `app/globals.css`.
*   **Database & API:** Supabase PostgreSQL (`@supabase/supabase-js` v2.107.0) for user data storage and query APIs.
*   **Payments Integration:** Razorpay SDK (`razorpay` v2.9.6) for user support checkouts.
*   **Animation System:** Framer Motion (v12.40.0) for layout transitions and toast reveals.
*   **Development Tools:** PostCSS, Autoprefixer, ESLint, and TypeScript declarations.

---

## 3. Architecture & Routing Map

### Application Architecture
SheetStride is designed as a hybrid Progressive Web App:
1.  **React Server Components (RSC):** Performs initial data fetches (such as loading static lists of target companies, database schemas, or pattern definitions) on the server to speed up load times.
2.  **Client Hydration:** Hydrates tables, checkboxes, search logic, and gauges on the client side using the `"use client"` directive.
3.  **Authentication Control:** Middleware runs on the Next.js server, checking for JWT cookies. It auto-refreshes sessions using Supabase endpoints or redirects unauthenticated visitors to the login portal.

```text
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│      (Client Hydrated Pages / Framer Motion UI)        │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
  API Calls │ (Next.js Routes)      Database │ (Supabase REST)
            ▼                                ▼
┌─────────────────────────┐      ┌───────────────────────┐
│       Next.js API       │      │  Supabase PostgreSQL  │
│  (Razorpay checkout)    │      │ (RLS Tables and Views)│
└─────────────────────────┘      └───────────────────────┘
```

### Folder Route Mapping
*   `app/page.tsx` - Static public landing page.
*   `app/(auth)/login/page.tsx` - Authenticated access page supporting Magic Links and Google/GitHub OAuth.
*   `app/(app)/` - Protected group routes governed by `middleware.ts`.
    *   `dashboard/page.tsx` - Analytics center showing solving throughput, streaks, and progress.
    *   `profile/page.tsx` - Account detail summaries with linked LeetCode usernames.
    *   `progress/page.tsx` - Historical contributions heatmap and topic mastery distributions.
    *   `settings/page.tsx` - Profile edits and Razorpay donation buttons.
    *   `questions/page.tsx` - Questions Hub displaying roadmap tracks (Core, LeetCode, Company Sheets, and locked placeholders for NeetCode/Striver).
    *   `questions/leetcode-universe/page.tsx` - Paginated grid with filters for search, difficulty, and solved status.
    *   `questions/sheetstride-core/page.tsx` - Algorithmic patterns curriculum path.
    *   `questions/company-sheets/page.tsx` - Directory of 463 target companies.
    *   `questions/company-sheets/[slug]/page.tsx` - Checklist of interview questions for a selected company, sorted by occurrence frequency.
*   `app/patterns/[slug]/page.tsx` - SEO dynamic template loading pattern definitions and boilerplate code templates.
*   `app/topics/[topic]/page.tsx` - Category view compiling questions tagged under specific computer science topics.

---

## 4. Database Layer (PostgreSQL Schema)

The database runs on Supabase (PostgreSQL) and exposes these core relations, views, and RPC handlers:

```text
  ┌──────────────┐             ┌───────────────────┐             ┌───────────┐
  │  companies   │             │ company_questions │             │ questions │
  ├──────────────┤             ├───────────────────┤             ├───────────┤
  │ id (UUID-PK) │────────────<│ company_id (FK)   │             │ ID (PK)   │
  │ company_name │             │ question_id (FK)  │>────────────│ Title     │
  │ slug         │             │ frequency         │             │ Difficulty│
  └──────────────┘             └───────────────────┘             │ Link      │
                                                                 └─────┬─────┘
                                                                       │
                               ┌───────────────────┐                   │
                               │   user_progress   │                   │
                               ├───────────────────┤                   │
                               │ user_id (FK)      │                   │
                               │ question_id (FK)  │>──────────────────┘
                               └───────────────────┘
```

### Table Specifications
1.  **`questions`:** Stores 3,647 LeetCode problems (ID, Title, Difficulty, Link, Topics, Acceptance Rate, Similar Questions).
2.  **`companies`:** Profiles 463 interview-tracked companies (id UUID, company_name, slug).
3.  **`company_questions`:** Junction mapping questions to companies with an interview occurrence weight (company_id, question_id, frequency numeric).
4.  **`user_progress`:** Tracks problem completions (user_id UUID referencing auth.users, question_id INT, completed boolean, completed-at timestamp).
5.  **`sheet_questions`:** Maps questions to SheetStride Core roadmap modules (Sheet_order, question_id, question_name, Pattern_name, topic_name).
6.  **`pattern_metadata`:** Holds algorithm descriptions, complexity requirements, and template boilerplate code (pattern_name, topic_name, core_idea, recognition_keywords, tc, sc, difficulty, cpp_template).

### Row-Level Security (RLS) Policies
*   **User Tracking:** `user_progress` and `profiles` tables have RLS enabled and restrict read/write access strictly to the owner (`auth.uid() = user_id`).
*   **Master Curriculum:** `questions`, `companies`, `company_questions`, `sheet_questions`, and `pattern_metadata` tables have RLS enabled and allow public SELECT access to all roles (both `anon` and `authenticated`) while restricting insertions/modifications.


### Database Views
*   `view_sheet_questions`: Combines `sheet_questions` and `questions` to build the core roadmap checklist.
*   `view_company_summary`: Groups `companies` and `company_questions` to provide company profiles and problem counts.
*   `view_company_questions`: Joins `company_questions`, `companies`, and `questions` to output frequency-weighted problem sheets.

### Custom Functions (RPC)
*   `calculate_user_streaks(target_user_id uuid)`: Scans `user_progress` logs to calculate consecutive active days, returning `{ res_current_streak, res_max_streak }`.

---

## 5. Core Development Conventions

To keep the application modular and performant, developers must adhere to these coding patterns:

### A. State Synchronization Bus (The `"question-solved"` Event)
Next.js layout components (e.g. sidebars, progress meters, heatmaps) are decoupled from checklists. When a user checks a problem:
1.  The checkbox component triggers an optimistic local change for immediate 60fps feedback.
2.  It sends an asynchronous query to Supabase.
3.  It dispatches a custom browser event:
    ```javascript
    window.dispatchEvent(new Event("question-solved"));
    ```
4.  Unrelated metrics components listen for this event and update their progress counters dynamically:
    ```typescript
    useEffect(() => {
      const handleSync = () => fetchUpdatedMetrics();
      window.addEventListener("question-solved", handleSync);
      return () => window.removeEventListener("question-solved", handleSync);
    }, []);
    ```

### B. Client vs. Server Data Strategy
*   Static resources, directories, and metadata views must be loaded via Server Components or static page rendering.
*   Interactive lists, pagination controls, search inputs, charts, and toggle systems must reside in Client Components (marked by `"use client"`).

### C. Client-Side Caching Strategy (`fetchWithCache`)
To make page transitions feel smooth and instantaneous, database data queries should be wrapped in the `fetchWithCache` utility from `@/lib/utils`:
1. The caching helper stores JSON-serialized results in `localStorage` with a specified Time-To-Live (TTL).
2. All page-level and query-level cache keys (e.g., `questions_hub_stats_`, `profile_data_cache_`, `user_solves_cache_`, `leetcode_universe_questions_cache_`) are registered in `lib/utils.ts` and cleared synchronously when the `"question-solved"` event is received.
3. Dashboard queries and LeetCode live sync statistics are bypass-decached and run live on every load to guarantee real-time updates without cache latency.

---

## 6. Known Limitations & Technical Gotchas

Keep these technical quirks in mind during development:

### 1. Postgrest SELECT Limit (1,000 Rows)
*   **Issue:** Supabase's underlying API parser restricts dynamic query responses to a maximum of 1,000 lines.
*   **Resolution:** When pulling the master LeetCode database (3,600+ questions), implement explicit offset range constraints:
    ```typescript
    await supabase.from("questions").select("*").range(fromIndex, toIndex);
    ```

### 2. Node v20 WebSocket Polyfill
*   **Issue:** Some Node 20 environments lack native WebSocket support, crashing the Supabase client during script executions (like imports or CLI utilities).
*   **Resolution:** Inject a mock polyfill at the top of utility scripts before initializing Supabase:
    ```javascript
    global.WebSocket = class {};
    ```

### 3. PowerShell Parenthesis Path Error
*   **Issue:** PowerShell errors out when executing commands containing parenthesis in paths (e.g. `app/(app)/questions/page.tsx`).
*   **Resolution:** Always wrap directory paths containing parenthesis in double quotes when running scripts or commands:
    ```powershell
    git add "app/(app)/questions/page.tsx"
    ```

### 4. OTP Redirect Session Lag
*   **Issue:** The Supabase Auth router can experience lag while establishing sessions during Magic Link redirections.
*   **Resolution:** The login redirect handler must display a spinner to indicate that session authentication is in progress.

### 5. PostgreSQL Manual Joins on Missing Schema Constraints
*   **Issue:** Postgrest returns relation join errors (`PGRST200`) when executing joined select operations (like `.select("*, questions(*)")`) if there is no registered foreign key constraint between the tables in the PostgreSQL schema cache.
*   **Resolution:** Perform queries in two separate steps (fetching the progress rows first, and manual inline querying of question details by ID lists) to manually reconstruct joined items.

---

## 7. Current Project State Matrix

### ✅ Complete
*   Authentication (OAuth / Magic Link OTP)
*   SheetStride Core Roadmap Tracks
*   LeetCode Universe Search Engine (paginated fetching)
*   Company Sheets Hub (463 companies, frequency listings)
*   Analytics Dashboard (Heatmap, Weekly Throughput, SVG Radial Mastery Gauges)
*   Razorpay Order & Signature Verification API handlers
*   Streak Calculations (Current & Peak)
*   Spaced Repetition Revision Engine (Initial Solve Reflection, scheduling multipliers, Revisions Queue dashboard tab, tabbed Spaced Repetition panel on Progress page, and Early Practice checks to preserve scheduled future due dates during early attempts)
*   Interview Notebook, History Log & LeetCode Description Drawer (Drawer tabs, editable text blocks, chronological log viewer, interactive description display, collapsible hints accordion, like/dislike stats, and back navigation controls)
*   Submission Calendar HUD (Progress page calendar grid displaying past solves and revision cards, styled with distinguishable cyber yellow borders and background highlights)
*   Client-Side Caching layer (`fetchWithCache` across Questions Hub, Profile, Progress, LeetCode descriptions with 24hr TTL, and LeetCode Universe with dynamic auto-invalidation, decached dashboard queries)
*   Layout-matched Skeleton UI loaders (shimmer placeholders matching cards, grids, tables, Submission Calendar grid, and problem description layout blocks across all hydration pages)
*   Yellow snowfall backdrop canvas on pitch-black login UI (with amber brand border controls)
*   Corrected live stats sync proxy routes `/api/leetcode-contests` and live `/cleanUsername/profile` query sanitizers
*   Postgres manual join helpers on progress retrieval ranges

### 🟡 In Progress
*   Pattern Handbook Boilerplates (Expanding C++ to Python and Java templates)

### ❌ Locked / Not Started
*   NeetCode 150 Integration (Placeholder cards in Questions Hub)
*   Striver A2Z Sheets (Placeholder cards in Questions Hub)
*   Blind 75 & Grind 169 Lists (Placeholder cards in Questions Hub)

---

## 8. Maintenance Mode: Context Refresh Command

This instruction set allows future AI sessions to update this documentation system after changes are made to the codebase.

```markdown
## Context Refresh Command

When modifying the codebase or updating database schemas, you MUST execute a project re-scan to keep documentation aligned:

1. **Re-Scan Repository:** Scan folders (`app/`, `components/`, `lib/`) and identify changes to routes, files, or packages.
2. **Review Database Schema:** Query Supabase DDL specs or examine SQL files to detect schema changes.
3. **Verify Existing Files:** Check the following project documentation for updates:
   - `AGENTS.md` (Tech stack, folder responsibilities, rules)
   - `PROJECT_STATE.md` (Features status checks)
   - `ARCHITECTURE.md` (Routing, data flow schemas)
   - `DATABASE.md` (PostgreSQL schemas, views, RPCs)
   - `API_REFERENCE.md` (REST, internal payloads)
   - `FEATURES.md` (PM-facing feature index)
   - `DECISIONS.md` (Architectural decisions log)
   - `ROADMAP.md` (Future deliverables roadmap)
4. **Preserve Manual Notes:** Retain developer annotations or manual markdown notes.
5. **Update Context Sheet:** Rewrite `PROJECT_CONTEXT.md` to reflect the updated codebase, keeping the file size between 1,500 and 3,000 words.
```
