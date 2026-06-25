# SheetStride Product Constitution & Principles

This document defines the core product philosophy, design guidelines, and architectural rules of SheetStride. It acts as the guiding constitution for the platform. Every future feature, user experience flow, database modification, and software architecture decision must align with the principles detailed herein.

---

## 1. Product Identity

SheetStride is a focused workspace for engineers preparing for technical interviews and mastering data structures and algorithms (DSA).

*   **What SheetStride is:**
    *   **A DSA Operating System:** A structured workspace for organizing the process of interview preparation.
    *   **An Interview Preparation Workspace:** A tool designed to build interview-ready communication and problem-solving strategies.
    *   **A Cognitive Tracking Platform:** A system that monitors understanding, common mistakes, and spacing intervals.
*   **What SheetStride is NOT:**
    *   An Online Judge (we do not compile or execute user code).
    *   A Code Editor (we do not provide IDE or text editing interfaces for coding).
    *   Another LeetCode clone (we do not host questions or test suites).
    *   A Competitive Programming platform (we focus on interview patterns, not optimal performance tricks).

---

## 2. Core Philosophy

The division of labor between execution platforms (like LeetCode) and SheetStride is absolute:

> **LeetCode executes; SheetStride organizes.**
> **LeetCode measures correctness; SheetStride measures understanding.**

```text
    ┌─────────────────────────┐         ┌─────────────────────────┐
    │     LeetCode Layer      │         │   SheetStride Layer     │
    │  (Coding & Execution)   │         │  (Reflection & Review)  │
    ├─────────────────────────┤         ├─────────────────────────┤
    │ Write Code              │         │ Map Algorithmic Pattern │
    │ Run Tests               │ ──────> │ Log Cognitive Feedback  │
    │ Optimize Performance    │         │ Review Spaced Queue     │
    │ Achieve Green Check     │         │ Build Verbal Dry Run    │
    └─────────────────────────┘         └─────────────────────────┘
```

LeetCode is where users write code. SheetStride is where users reflect on how they solved the problem, document why the pattern worked, identify the mistake they made, and schedule a review to ensure long-term retention. 

---

## 3. Product Principles

Every feature added to SheetStride must satisfy the following:

1.  **Retention Over Volume:** We do not celebrate solving 500 questions mindlessly. We celebrate mastering 100 questions deeply. Features should discourage the "grind mindset" and encourage deliberate spaced review.
2.  **Capturing Cognitive State:** Completion status (Solved/Unsolved) is insufficient. We must capture *how* the user solved it: Did they need hints? Did they recognize the pattern immediately? What mistake did they make?
3.  **Active Spaced Revision:** A question is not finished because it was solved once. Spaced repetition must require the user to actively re-attempt the problem before completing the review.
4.  **Friction Minimization:** The user is already experiencing cognitive fatigue from solving complex algorithmic problems. Our interface must minimize form fields, eliminate unnecessary clicks, and require less than 15 seconds to log reflections.
5.  **Actionable Progress:** Statistics must serve a purpose. Do not display charts unless they direct the user to their next high-value action (e.g., highlighting mistake hotspots or identifying overdue reviews).

---

## 4. User Philosophy

SheetStride is built for candidates preparing for competitive, high-stakes software engineering interviews (FAANG, HFTs, and product startups). 

*   Our users are busy, focused, and often highly stressed.
*   We respect their attention. We do not use gamification tactics, email spam, or pushy notifications.
*   We design for habit formation. The platform should feel like an elite training facility: clean, quiet, and optimized for performance.

---

## 5. Design Philosophy

The visual aesthetic is critical to SheetStride's premium experience. It must remain cohesive across all screens:

*   **Design Theme:** Neo-Industrial Cyberpunk Terminal.
*   **Color System:**
    *   **Primary Background:** Deep, premium dark mode (`#0B0B0C`, `#121214`).
    *   **Core Accents:** Amber/Yellow for primary actions and active highlights.
    *   **Special Accents:** Orange is reserved strictly for DSAC (SheetStride Core) branded paths.
*   **Component Language:**
    *   **Glassmorphism:** Use translucent card layouts with subtle glowing borders (`border-white/10`).
    *   **Subtle Micro-animations:** Apply Framer Motion for staggered lists, slide-over panels, and micro-interactions.
    *   **Typography:** Clear separation between terminal-style monospaced fonts (for statistics and system codes) and premium geometric sans-serif fonts (Outfit/Inter for core readable interface content).

---

## 6. Architecture Philosophy

Our engineering decisions must reflect simplicity and long-term maintainability:

1.  **Prefer Deterministic Rules:** Avoid using unnecessary AI or ML models. Spaced repetition intervals and recommendations must follow clean, deterministic mathematical rules.
2.  **Database Simplicity:** Maintain a clean Supabase schema. Avoid table inflation. Extend existing structures (like `user_progress`) before creating new relational tables.
3.  **Note/Log Separation:** Keep point-in-time, immutable telemetry logs (reflections, attempts) separate from mutable knowledge artifacts (user notebooks, takeaways).
4.  **No Code Bloat:** Do not pull heavy third-party npm packages for simple UI tasks. Build components natively using Tailwind CSS and lightweight React utilities.

---

## 7. AI Usage Philosophy

When AI features are integrated, they must align with our educational guidelines:

*   AI should **guide**, not solve. Never provide the direct solution to a user.
*   AI should **explain**, not automate. Help users debug their mental model, not write their boilerplate code.
*   Never remove the **productive struggle**. The learning happens when the user works through the problem. AI should only point them toward the right pattern.

---

## 8. Future Feature Checklist

Before writing any code or modifying any database schema for a new feature, run this checklist. If any answer is **No**, the feature must be rejected or redesigned:

*   [ ] Does this feature improve long-term pattern retention?
*   [ ] Does it help the user prepare for real-world interview conditions?
*   [ ] Can the user complete the action flow in under 20 seconds?
*   [ ] Does it avoid duplicating functionality already handled by LeetCode?
*   [ ] Does it fit cleanly into the existing database schema without adding table bloat?

---

## 9. Long-Term Vision

SheetStride is designed to be the definitive **workspace for algorithmic mastery**. 

While LeetCode remains the execution platform where developers verify their code, SheetStride is the platform they return to after every solve. It is where their knowledge is structured, their mistakes are analyzed, and their readiness for the next career step is refined. We build tools that make developers smarter, more structured, and highly confident under pressure.
