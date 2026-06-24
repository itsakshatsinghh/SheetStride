# Project Memory: ROADMAP.md (Development Roadmap)

This document details the project roadmap for SheetStride, categorized by immediate, short-term, and long-term milestones based on the current implementation state.

---

## 1. Immediate Priorities (Production Readiness)
*These tasks are required to make the current feature set stable and production-ready.*

*   **Database Row-Level Security (RLS) Configuration:**
    *   **Context:** The `companies` and `company_questions` tables allow read operations.
    *   **Task:** Restrict write permissions (inserts, updates, deletes) to admin service keys and write strict client read permissions.
*   **Performance Optimization on Joined Tables:**
    *   **Context:** Joining `questions`, `companies`, and `company_questions` view searches can become sluggish as datasets scale.
    *   **Task:** Add performance indexes in PostgreSQL:
        *   Composite index on `company_questions(company_id, question_id)`
        *   Index on `user_progress(user_id, question_id)`
*   **Link Razorpay Checkout to User Subscription Flag:**
    *   **Context:** `/api/verify-payment` validates the order signature but doesn't persist the user's donor status.
    *   **Task:** Create a `user_payments` table in Supabase and write a record upon successful signature verification. Set a `is_premium` flag on the user profile to unlock future perks.
*   **Session Recovery OTP Fixes:**
    *   **Context:** Sluggish token verification during OTP/Magic Link redirect.
    *   **Task:** Improve the validation state UI in `login/page.tsx` with clear loading skeletons and automatic error-handling retries.

---

## 2. Short-Term Goals (Next Major Deliverables)
*These features represent the next items to build based on current placeholders.*

*   **NeetCode 150 & Striver A2Z Roadmap Integration:**
    *   **Context:** Cards for NeetCode 150, Striver Sheets, and Blind 75 currently exist in the Questions Hub as locked placeholders.
    *   **Task:** Import questions data into respective database tables, map patterns, build database views (e.g. `view_neetcode_questions`), and implement dedicated dynamic checklist sheets.
*   **Expand Pattern Handbook Boilerplates:**
    *   **Context:** The `pattern_metadata` table only contains a C++ template column.
    *   **Task:**
        *   Add columns for `python_template` and `java_template`.
        *   Implement a language switcher in the pattern detail UI (`app/patterns/[slug]/page.tsx`).
*   **Breadcrumb and Navigation Flow Refinement:**
    *   **Context:** Some nested links in company sheets can lose context when navigated recursively.
    *   **Task:** Refine the breadcrumb logic to dynamically resolve company names and pattern titles from URL parameters.

---

## 3. Long-Term Goals (Strategic Product Evolution)
*Strategic features that enhance product capabilities without changing the core codebase design.*

*   **Public Profile Portfolios & Sharing:**
    *   **Context:** Users want to show off their dashboard stats and activity heatmap.
    *   **Task:** Implement public profile routing (e.g., `/user/[username]`) displaying their solve metrics, topic mastery charts, and streak histories. Enable export options (JSON / Resume friendly PDF).
*   **Automated Streak Management via DB Triggers:**
    *   **Context:** Currently, the streaks are calculated on the fly using a SQL RPC function.
    *   **Task:** Build a PostgreSQL trigger that executes whenever a row is inserted/deleted in `user_progress`. Recalculate the user's current/max streak and write it to a `user_profiles` caching table, reducing computation cost on dashboard load.
*   **Global & Regional Coding Leaderboards:**
    *   **Context:** Gamifying interview prep increases daily active metrics.
    *   **Task:** Build real-time ranking tables comparing user completion counts and weekly question throughput.
