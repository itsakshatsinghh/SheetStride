# Project Memory: AGENTS.md (Master Entry Point)

Welcome to **SheetStride**. This documentation layer serves as a persistent, high-signal project memory system to minimize context-rebuilding costs for AI assistants in future sessions.

---

## 1. Project Overview
*   **Project Name:** SheetStride
*   **Purpose:** A premium, cyberpunk-themed coding interview preparation platform. It helps software engineers organize, track, and master algorithmic patterns and LeetCode questions in a highly structured way.
*   **Target Users:** Software engineers preparing for FAANG, HFTs, SaaS providers, startups, and product-based companies.
*   **Core Problem Solved:** Reduces interview prep fatigue by transitioning users from mindless LeetCode grinding to deliberate algorithmic pattern mastery (e.g. Converging, Sliding Window, Fast & Slow pointers), tracking progress uniformly across multiple curated roadmap sheets (SheetStride Core, NeetCode, Striver, Company Sheets, and LeetCode Universe).
*   **Product Vision:** A high-fidelity, interactive training environment combining rich visual metrics, gamified streak tracking (cyberpunk Heatmaps/Weekly Throughput), and targeted corporate curriculum paths.

---

## 2. Technology Stack
*   **Framework:** Next.js (v15.0.3), App Router (primarily static site generation combined with client-side hydration).
*   **Frontend Logic:** React (v18.3.1), TypeScript (v5.6.3).
*   **Styling & Design System:** Tailwind CSS (v3.4.15) with custom dark-mode variables, Google Fonts (Outfit, Inter), and Lucide React (v0.511.0) icons. Features rich micro-animations, glassmorphism card highlights, and cyberpunk accent glows.
*   **Animations:** Framer Motion (v12.40.0) for staggered grid reveals, slide-in toasts, and smooth layout changes.
*   **Database & Backend-as-a-Service:** Supabase (`@supabase/supabase-js` v2.107.0), running on PostgreSQL.
*   **Payment Gateway:** Razorpay (`razorpay` v2.9.6) for premium checkouts.
*   **API Client:** Axios (v1.17.0) and standard native Fetch.
*   **Authentication:** Supabase Auth (configured with Magic Link OTP and Google/GitHub OAuth).

---

## 3. Folder Structure & Responsibilities
*   `app/` - Next.js App Router root folder.
    *   `app/(app)/` - Protected group routes.
        *   `app/(app)/dashboard/` - Main analytics control center (Weekly Throughput, Topic Mastery).
        *   `app/(app)/profile/` - User stats, profile customization, and social connection integrations.
        *   `app/(app)/progress/` - Interactive system analytics (Activity Heatmaps, Topic Distributions).
        *   `app/(app)/settings/` - Profile updates, checkout flows, and password-free auth triggers.
        *   `app/(app)/questions/` - Questions Hub root index page.
            *   `app/(app)/questions/leetcode-universe/` - Comprehensive LeetCode database filters.
            *   `app/(app)/questions/sheetstride-core/` - Core roadmap (Topic $\rightarrow$ Pattern explorer paths).
            *   `app/(app)/questions/company-sheets/` - Newly implemented corporate sheets (463 companies).
    *   `app/api/` - Next.js Route Handlers for server actions (Razorpay transactions).
    *   `app/login/` - Login screen (OTP and OAuth provider buttons).
    *   `app/patterns/` - Static dynamic route mappings for public pattern SEO templates.
    *   `app/topics/` - Static dynamic route mappings for topics and categories.
*   `components/` - Shared and modular UI components.
    *   `components/app/` - Core layout wrappers (e.g. `shell.tsx`, sidebars, and top navigation HUDs).
    *   `components/providers/` - React Context providers (e.g. `auth-provider.tsx`).
    *   `components/shared/` - Complex visualization elements (e.g. `heatmap.tsx` contributions grids, `breadcrumbs.tsx`).
    *   `components/ui/` - Pure UI components (e.g. `badge.tsx`).
*   `lib/` - Utility libraries and static configurations.
    *   `lib/supabase.ts` - Supabase client initialization.
    *   `lib/mock-data.ts` - Mock data definitions for offline testing.
    *   `lib/slugs.ts` - String slugification maps for topic/pattern routes.
    *   `lib/utils.ts` - Class merging utilities (`cn`).

---

## 4. Development & Coding Rules
1.  **Client-Side Hydration:** Interactive tables, checkbox toggles, dynamic search filters, and dashboard meters must use `"use client"` directive.
2.  **Supabase Client Safety:** Use the public client imported from `@/lib/supabase` for queries. Do not try to bypass RLS policies or run DDL commands directly on the client side.
3.  **State Synchronization:** When updating question progress, write the update to `user_progress` table and immediately dispatch the custom `"question-solved"` event:
    ```javascript
    window.dispatchEvent(new Event("question-solved"));
    ```
    This coordinates live data updates (analytics progress bar, heatmaps, activity meters) across component layers.
4.  **PowerShell Compatibility:** Always wrap Next.js paths containing parenthesis in double quotes (e.g. `"app/(app)/questions/page.tsx"`) when giving terminal instructions to prevent parsing errors.
5.  **Clean CSS:** Do not add inline styles. Rely on Tailwind classes and custom utilities from the global layout stylesheet.

---

## 5. Current Implementation Status
*   **Core Roadmap:** Fully implemented with static compilation, detail grids, and markdown template parsing.
*   **LeetCode Universe:** Fully implemented (paginated fetching to bypass Postgrest 1,000-row limit, multi-topic filter search).
*   **Company Sheets:** Fully implemented (database views created, 463 unique companies mapped, search filtering active, responsive card grids, detail lists with interview frequencies).
*   **User Streaks/Heatmap:** Configured via Supabase database RPCs (`calculate_user_streaks`) and client local storage backup.

---

## 6. AI Session Startup Guide
To quickly resume context when starting a new session:
1.  **Current Project Status:** Read `PROJECT_STATE.md` to see what is complete vs. in progress.
2.  **Architecture:** Review `ARCHITECTURE.md` to trace the data flow and route mappings.
3.  **Database Schemas:** Review `DATABASE.md` to check column types, foreign keys, views, and index constraints.
4.  **Short Summary:** Review `PROJECT_CONTEXT.md` for a high-signal overview.
