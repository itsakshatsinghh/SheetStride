# Project Memory: PROJECT_STATE.md (Current Implementation State)

This snapshot represents the current status of features, models, and integrations across SheetStride.

---

## 1. Feature Status Matrix

### ✅ Complete
*   **Authentication Flow:** Supabase Auth Integration with Google/GitHub OAuth and passwordless OTP/Magic Link triggers.
*   **Mission Library (SheetStride Core):** Staged flagship roadmap containing 437 tasks divided by topic and pattern.
*   **LeetCode Universe Database:** Fully indexed search engine for 3,647 LeetCode questions, complete with paginated fetching, difficulty filters, and topic selection.
*   **Company Sheets (FAANG & HFTs):** Interactive corporate sheet hub loaded dynamically via `view_company_summary` (463 companies). Provides interview prep lists sorted by frequency.
*   **Refined Mission Control Dashboard:** A highly focused, premium daily command center that answers "What should I do next?" in a clean, professional 2-column workspace. Features Today's Study Roadmap, a client-side localStorage-based **Resume Session** widget (one-click shortcuts to last visited patterns, blueprints, questions, or company sheets), a unified **Plan Diagnostics** summary card, and dynamic **Preparation Insights** (which flags pattern-recognition overlap confusions and weekly activities based on historical logs). Includes an upgraded **Focus Topics (Monthly Focus)** modal which resolves selection state bugs using database `.upsert()`, displays active focus cycle duration countdowns (e.g. `Day 3 of 7`), and features 4 custom scheduler questions (Focus Duration, Target Difficulty, Question Source, and Revision Workload Density) to fine-tune daily question generation. All heavy visual grids (like heatmaps and proficiency logs) have been moved to the Progress page.
*   **Profile System:** Cyberpunk split layout showing user stats, profile detail updates, and premium Razorpay donation links.
*   **Streak Tracking:** Auto-calculation of solve streaks (current and max) via database RPCs.
*   **Spaced Repetition Revision Engine:** Lightweight 15-second cognitive reflection modal on solve checkoff, automatic scheduled revision queue, and multiplier feedback loops. Features **Workload Optimization & Token System** with a strict structural cap of `5` visible items maximum in the Due Queue (oldest overdue items surface dynamically as items are cleared), a **Flat Daily Progress Goal Tracker** (`"Daily Revision Goal: [X / 1] Cleared"`) to establish a "One-In, One-Out" rhythm, adjusted spacing multipliers (`easier`: 2.5x, `same`: 1.5x, `difficult`: soft-cushion `Math.max(4, Math.floor(interval * 0.8))`), elevated historical notes display (`biggest_takeaway` & `note_to_self` rendered as bold text blocks at top of review mode), and a 5-minute crux dry-run paper verification prompt above difficulty selection. Preserves **Early Practice Protection**, dedicated tabbed **Revision Engine Queue** (Due vs. Upcoming) on Progress page, and **LeetCode Premium skips** (`completed-at` set to `'1970-01-01'`).
*   **Interview Notebook & LeetCode Description Drawer:** A unified, high-fidelity **My Approach** strategy notebook (replacing the previous 6-field study wiki) to write code-flow insights directly into the `biggest_takeaway` column on `user_notebooks`. Added support for rendering interactive problem descriptions, collapsible system hints, likes/dislikes metrics, direct LeetCode attempt links, and dynamic back-navigation headers.
*   **Submission Calendar HUD & Redesigned Progress Cards:** Interactive dark-themed calendar grid embedded on the Progress page representing solved dates and due revisions. Features a redesigned cyberpunk panel layout including:
    *   **Topic Mastery Index:** pulsing green status light and bordered percentage badges.
    *   **System Telemetry Logs:** a unified telemetry card combining current streaks, weakest DSA node (with red-error borders), and peak activity cycles.
    *   **DSA Module Distribution:** a high-fidelitymonospace table representing progress indices and solved ratios.
    *   **Submission Calendars:** distinguishability cyber yellow borders and background tints for solved vs. revision events. Includes dynamic formatting that displays `"PREMIUM"` for premium-skipped question logs.
*   **Client-Side Caching Layer:** Persistent browser-level caching using `fetchWithCache` across Questions Hub, Profile, Progress Analytics, LeetCode descriptions (24hr TTL), and LeetCode Universe (complete with automatic cache invalidation via custom solve event bus). Dashboard data loading and LeetCode profile sync stats load completely live on every entry/solve event to eliminate sync delays.
*   **Skeleton Loading UI:** Layout-matched, shimmering dark-mode skeletons integrated across all dynamic hydration pages (Dashboard, Progress Analytics, Questions Hub, LeetCode Universe, SheetStride Core Index, Topic, Pattern detail pages, Company Sheets Index, details, Profile, and Submission Calendar HUD / description drawer) to minimize layout shifts (CLS) and improve perceived performance.
*   **Pattern Atlas (Phase 2):** Fully implemented the premium interactive learning directory:
    *   **Compiler Pipeline Alignment:** Refactored `compiler.ts` to dynamically parse titles, H2 overview headers, signals, mental models, optimization steps, and variants directly from the raw markdown documents. Supports bulleted lists of problems under `## Representative Problems`.
    *   **Logical Section Organization:** Detail pages split into tabbed sections (**LEARN**, **PRACTICE**, **MASTER**) with Framer Motion transitions.
    *   **Interactive Visualizer:** Metadata-driven playback panel (`PatternVisualizer`) supporting step execution, autoplay loops, sliders, and type-based state simulation (Array pointers, cycles, traversal, heaps).
    *   **Curriculum progression graph:** Displays horizontal node progression charts for the current pattern path.
    *   **Reference Only Questions:** Disables solve checkoffs and database writes for unmapped reference problems, rendering a "Reference Only" status.
    *   **Card Search & Progress:** Extended search filters to query aliases, variants, data structures, and keywords. Renders solved counts, completion %, confidence, and revision due dates for authenticated users.
*   **Training Ground & Challenges Hub (Phase 2 Core):** Fully implemented the interactive algorithmic pattern-recognition workspace:
    *   **Patterns Index page (`/patterns`):** Cyberpunk dashboard with WebGL matrix animated background (`TerminalShader`), bold headers, and selector card pathways to Pattern Atlas and Challenges Hub.
    *   **Pattern Recognition Simulator:** Step-by-step game loop (descriptive text decoding, 30-second clocks, primary clues, approach dropdowns, reflection notes) utilizing unescaped HTML parsers and a 60:40 split LeetCode-style screen layout with an operator notes dry-run scratchpad.
    *   **Interactive Monthly Calendar Tracker:** A full monthly calendar grid in local browser time to track solve sessions. Days with active workouts saved in browser local storage display a dynamic indicator dot.
    *   **Daily Training Workout Packs:** Cascading generator logic that guarantees exactly 3 questions are generated for the selected date key. Links question items to LeetCode and hooks "Mark Solved" buttons directly to the global Interview Notebook Reflection Drawer.
    *   **Once-a-Day Generation Boundary:** Restricts workout generation/creation to once per day, resetting exactly at 5:00 AM IST (UTC shifted by +30 minutes). Prevents pack regeneration once today's workout has been generated.
    *   **Resilient Practice Logs Fallback:** Features combined fetches (remote `drill_history` table + local storage backups `sheetstride-drill-logs`) so logs and recognition insights are loaded instantly even if Supabase schema cache resets.
*   **Typography Standardization (Phase 3 Audit & Realignment):** Standardized typography scale (e.g. `text-body-sm`, `text-body-md`, `font-body-lg`, `text-headline-sm`, etc.) using Outfit and Inter font families across all pages. Removed arbitrary size properties to ensure Stripe/Linear-like premium visual hierarchy.
*   **Solution Blueprint Workspace UX V1 Redesign:** Upgraded the reflection flow to a vertical connected timeline engineering checklist (`THE IDEA`, `THE STRATEGY`, `BUILD THE SOLUTION`, `PERFORMANCE`, `REMEMBER`) with dynamic HUD progress trackers, auto-scaffolded template steps matching the selected pattern, proceed actions, and live snap-shot telemetry logging. Includes a fully integrated **Replay Blueprint** slide-deck viewer wired directly to the Revision Engine triggers (Revision Queue, Daily Roadmap, and Calendar HUD), complete with auto-playback (3s), keyboard slide navigation (ArrowLeft, ArrowRight, Space, Escape), restart playback controls, and separated Complexity and Reflections slides.
*   **Decoupled Planner Engine & Study Practice Restructure:** Integrated the branch merge from `main` to decouple the Study Planner engine, add Supabase pref sync, and rename the `/training-ground` path to `/practice` workspace cleanly.

### 🟡 In Progress
*   **None:** All target roadmap features are completed.

### ❌ Not Started / Locked
*   **NeetCode 150 Sheet Integration:** Placeholder card created in Questions Hub; integration is locked pending roadmap expansion.
*   **Blind 75 & Grind 169 Lists:** Placeholders created; waiting for roadmap additions.
*   **Striver A2Z Sheet:** Placeholder created; waiting for data ingestion.

---

## 2. Technical System Progress

| System | Completed | Partially Completed | Missing |
| :--- | :--- | :--- | :--- |
| **Auth System** | Login, Auth Context Provider, Middleware protection | Session recovery (sometimes sluggish on OTP verify) | None |
| **Analytics** | Radial charts, week bars, peak day calculations, heatmap | None | None |
| **Questions Hub** | SheetStride Core, LeetCode Database, Company Sheets, Pattern Atlas | None | External Sheets (Neetcode/Striver) |
| **Database** | RLS tables and master public-read policies configured, views, streak calculation function | None | Custom triggers for automated streak updates |
| **Checkout API** | Razorpay Order Creation and Verification Route Handlers | None | Production payment webhooks |
| **Caching Layer** | Local caching (`fetchWithCache`) on Questions Hub, Profile, Progress, and LeetCode Universe; invalidate-on-solve triggers; decached real-time query engines on Dashboard and LeetCode stats | None | None |
