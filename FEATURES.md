# Project Memory: FEATURES.md (Business Feature Inventory)

This document provides a business-level feature inventory of SheetStride. It outlines the purpose, status, technical dependencies, files, and future product improvements for each capability.

---

## 1. Authentication System (OTP & OAuth Provider)
*   **Purpose:** Simple and secure user registration and login experience. Eliminates the friction of passwords using GitHub/Google Social logins or Magic Link verification codes (OTP).
*   **Current Status:** ✅ Complete
*   **Dependencies:** Supabase Auth, client cookies, security middleware checks.
*   **Files Involved:**
    *   [auth-provider.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/components/providers/auth-provider.tsx) (Global session provider)
    *   [middleware.ts](file:///c:/Users/Akshat/Desktop/SheetStride_at2/middleware.ts) (Route protection & session refreshing)
    *   [login-screen.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/components/shared/login-screen.tsx) (Cyberpunk login card component)
    *   [app/(auth)/login/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(auth)/login/page.tsx) (Auth entry page)
*   **Future Improvements:** Implement session timeouts, role-based controls, and automatic recovery protocols for sluggish OTP validation.

---

## 2. System Analytics Dashboard & Progress Tracking
*   **Purpose:** Gamified dashboard to keep developers engaged. Visualizes coding velocity and mastery using active data representations. Includes:
    *   **Activity Heatmap:** GitHub-style contributions calendar tracking problems solved by date.
    *   **Weekly Throughput:** Weekly coding velocity bar graphs with custom animations.
    *   **Topic Mastery Meter:** SVG radial donut gauge indicating progress on individual computer science topics.
    *   **Streaks tracker:** Displays consecutive days active.
*   **Current Status:** ✅ Complete
*   **Dependencies:** Supabase `user_progress` table, `calculate_user_streaks` RPC, local storage caching, client-side window event bus.
*   **Files Involved:**
    *   [dashboard/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(app)/dashboard/page.tsx) (Dashboard portal)
    *   [progress/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(app)/progress/page.tsx) (Expanded progress graphs)
    *   [heatmap.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/components/shared/heatmap.tsx) (Contributions grid component)
*   **Future Improvements:** Add sharing capabilities (e.g. generate custom social share cards) and dynamic cohort leaderboards.

---

## 3. SheetStride Core (Flagship Roadmap)
*   **Purpose:** Curated interview curriculum mapping topics (e.g. Arrays, Trees) to specific algorithmic patterns (e.g. Sliding Window, Backtracking). Steers developers away from random grinding toward pattern recognition.
*   **Current Status:** ✅ Complete
*   **Dependencies:** `sheet_questions` table, `view_sheet_questions` view, `questions` master table.
*   **Files Involved:**
    *   [sheetstride-core/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(app)/questions/sheetstride-core/page.tsx) (Roadmap layout)
    *   [patterns/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/patterns/page.tsx) (Pattern index)
    *   [patterns/[slug]/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/patterns/[slug]/page.tsx) (Pattern detail sheet)
*   **Future Improvements:** Add step-by-step visualizers showing how algorithms process sample inputs in real time.

---

## 4. LeetCode Universe (Master Database Explorer)
*   **Purpose:** Fully searchable directory of over 3,600 LeetCode problems. Allows search by keyword, difficulty level, topic category, or solved status.
*   **Current Status:** ✅ Complete
*   **Dependencies:** `questions` database table, client-side pagination, database index constraints.
*   **Files Involved:**
    *   [leetcode-universe/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(app)/questions/leetcode-universe/page.tsx) (Infinite paginated table UI)
*   **Future Improvements:** Incorporate sort options by Acceptance Rate, Similar Questions count, and global Frequency Index.

---

## 5. Company Sheets Hub (FAANG & HFT Prep)
*   **Purpose:** Target list of interview questions asked at 463 specific companies (Google, Apple, Microsoft, Jane Street, etc.). Sorts questions by interview occurrence frequency.
*   **Current Status:** ✅ Complete
*   **Dependencies:** `companies` table, `company_questions` junction table, `view_company_summary` and `view_company_questions` database views.
*   **Files Involved:**
    *   [company-sheets/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(app)/questions/company-sheets/page.tsx) (Company directory)
    *   [company-sheets/[slug]/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(app)/questions/company-sheets/[slug]/page.tsx) (Company questions checklist)
*   **Future Improvements:** Introduce a timeline filter (e.g. last 3 months, last 6 months, last year) to reflect changing interview trends.

---

## 6. Pattern Handbooks (Algorithm Blueprints)
*   **Purpose:** Handbooks with descriptions, complexity limits, and boilerplate starter code for each algorithm pattern.
*   **Current Status:** 🟡 In Progress (C++ templates are integrated; Python and Java starter codes, along with pseudo-code walk-throughs, are currently under development).
*   **Dependencies:** `pattern_metadata` table.
*   **Files Involved:**
    *   [patterns-list-client.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/patterns/patterns-list-client.tsx)
    *   [patterns/[slug]/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/patterns/[slug]/page.tsx)
*   **Future Improvements:** Expand to include multiple programming language selectors with code highlight syntax themes.

---

## 7. Premium Checkout (Donations & Coffee Support)
*   **Purpose:** Support checkout enabling users to buy coffee for developers, unlocking profile badges or donation status.
*   **Current Status:** ✅ Complete
*   **Dependencies:** Razorpay Web Checkout SDK, Razorpay Node integration.
*   **Files Involved:**
    *   [coffee-button.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/components/shared/coffee-button.tsx) (Checkout popup trigger)
    *   [create-order/route.ts](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/api/create-order/route.ts)
    *   [verify-payment/route.ts](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/api/verify-payment/route.ts)
*   **Future Improvements:** Connect verify hooks to set a `is_premium` flag in user profile profiles on database.

---

## 8. External Curricular Roadmaps (NeetCode 150, Striver A2Z, Blind 75)
*   **Purpose:** Integrate external interview lists.
*   **Current Status:** ❌ Not Started / Locked (Cards exist in UI Questions Hub as placeholders).
*   **Dependencies:** Database schemas and respective dataset csv imports.
*   **Files Involved:**
    *   [questions/page.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/(app)/questions/page.tsx)
*   **Future Improvements:** Ingest data sheets, construct relational views, and implement dedicated checklist pages.
