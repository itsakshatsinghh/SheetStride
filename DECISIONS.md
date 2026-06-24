# Project Memory: DECISIONS.md (Architectural Decisions Log)

This document catalogs the key architectural decisions made in the development of SheetStride. Each decision is supported by code evidence and details the rationale and technical impact.

---

### Decision 1: Next.js App Router Framework (v15.0.3)
*   **Reason:** Next.js provides static site generation (SSG) for SEO-optimized pattern routes, server-side data fetching for lists, and robust file-system routing.
*   **Evidence:**
    *   Presence of the `app/` folder housing `app/layout.tsx`, `app/page.tsx`, and `app/(app)` folder structure.
    *   File structure pattern mapping routes like `/patterns/[slug]` and routing middlewares in `middleware.ts`.
*   **Impact:** Fast page navigation, pre-rendered static content for pattern handbooks, clean server-side protection wrappers, and standard Next.js API Route Handlers.

---

### Decision 2: Supabase (BaaS) for Database and Authentication
*   **Reason:** Speeds up development by providing PostgreSQL hosting, pre-built Row-Level Security (RLS), instant REST APIs, and authentication providers (OAuth & Magic Link OTP) without needing a dedicated backend API service.
*   **Evidence:**
    *   Import of `@supabase/supabase-js` (v2.107.0) in `package.json`.
    *   Initialization config inside [supabase.ts](file:///c:/Users/Akshat/Desktop/SheetStride_at2/lib/supabase.ts).
    *   Global session context in [auth-provider.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/components/providers/auth-provider.tsx).
*   **Impact:** Client components query tables directly using secure Supabase SDK filters. Access tokens are handled by Supabase Auth cookies and validated by middleware during routing.

---

### Decision 3: Client-Side Window Event Bus for State Synchronization
*   **Reason:** Next.js component layouts separate list checkboxes from analytics sidebars or top-bar progress gauges. A lightweight browser-native event bus ensures state changes trigger global counters without full page reloads or heavy global state libraries.
*   **Evidence:**
    *   Use of `window.dispatchEvent(new Event("question-solved"));` in list checkboxes when questions are toggled.
    *   Presence of `window.addEventListener("question-solved", ...)` in parent dashboard and layout components to trigger data refresh.
*   **Impact:** Real-time visual feedback across unrelated UI components, maintaining a highly responsive user experience (60fps updates) without introducing Redux/Zustand.

---

### Decision 4: Tailwind CSS with CSS Variables for Theme Configuration
*   **Reason:** Facilitates rapid component layout styles and supports dynamic dark themes, glassmorphism borders, and neon shadows essential for the cyberpunk UI.
*   **Evidence:**
    *   Configuration in [tailwind.config.ts](file:///c:/Users/Akshat/Desktop/SheetStride_at2/tailwind.config.ts).
    *   Custom color tokens (`--background`, `--accent`, `--accent-glow`, `--border`) specified in [globals.css](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/globals.css).
*   **Impact:** Modular CSS classes allow quick styling. Theme overrides are handled cleanly by shifting base class names, reducing stylesheet size.

---

### Decision 5: Razorpay Payment Gateway Integration
*   **Reason:** Simple payment infrastructure supporting regional checkout (INR pricing) to facilitate secure user checkout.
*   **Evidence:**
    *   `razorpay` library included in `package.json` dependencies.
    *   API route definitions in `/api/create-order` and `/api/verify-payment`.
    *   Payment modal handler in [coffee-button.tsx](file:///c:/Users/Akshat/Desktop/SheetStride_at2/components/shared/coffee-button.tsx).
*   **Impact:** Outsourced payment collection, signature validation on server using Node's HMAC-SHA256, and zero local credit card data liability.

---

### Decision 6: Framer Motion for Visual Animations
*   **Reason:** Allows creating smooth CSS-based animations (staggered entries, radial chart growths, loading pacman routines) to match the flagship cyberpunk styling.
*   **Evidence:**
    *   `framer-motion` (v12.40.0) in dependencies.
    *   Animation controls imported inside `TerminalHomepage`, layout shell components, and loading animations.
*   **Impact:** Fluid page load transitions, card entry hover animations, and premium visual feel across dashboards.
