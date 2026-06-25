# Project Memory: DATABASE.md (Supabase Database Layer)

This document reconstructs the complete PostgreSQL schema, views, and functions running on Supabase for SheetStride.

---

## 1. Relational ER Diagram Schema
```text
  ┌──────────────┐             ┌───────────────────┐             ┌───────────┐
  │  companies   │             │ company_questions │             │ questions │
  ├──────────────┤             ├───────────────────┤             ├───────────┤
  │ id (PK)      │────────────<│ company_id (FK)   │             │ ID (PK)   │
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

---

## 2. Table Specifications

### `questions` (LeetCode Master Database)
*   **Purpose:** Houses the master list of 3,647 LeetCode questions. Represents the single source of truth for problem data.
*   **Columns:**
    *   `ID` (`integer`, Primary Key): LeetCode problem ID.
    *   `Title` (`text`): Problem name (e.g. `"Two Sum"`).
    *   `Difficulty` (`text`): Difficulty level (`"Easy"`, `"Medium"`, `"Hard"`).
    *   `Link` (`text`): LeetCode problem URL (contains trailing slash).
    *   `Topics` (`text`): Comma-separated list of topics (e.g. `"Array, Hash Table"`).
    *   `Acceptance Rate (%)` (`numeric`): Problem acceptance rate.
    *   `Similar Questions` (`json`): JSON array listing related LeetCode exercises.

### `companies` (Corporate Sheets)
*   **Purpose:** Stores profiles for the 463 unique companies mapped under Company Sheets.
*   **Columns:**
    *   `id` (`uuid`, Primary Key, default: `gen_random_uuid()`): Unique identifier.
    *   `company_name` (`text`, Unique): Company name (e.g. `"Google"`, `"J.P. Morgan"`).
    *   `slug` (`text`, Unique): URL-friendly slug (e.g. `"google"`, `"jp-morgan"`).
    *   `created_at` (`timestamp with time zone`, default: `now()`).

### `company_questions` (Corporate Mappings)
*   **Purpose:** Junction table mapping companies to master questions with interview frequency weight.
*   **Columns:**
    *   `id` (`bigint`, Primary Key, Auto-increment): Unique index.
    *   `company_id` (`uuid`, Foreign Key referencing `companies.id`, `ON DELETE CASCADE`).
    *   `question_id` (`integer`, Foreign Key referencing `questions.ID`, `ON DELETE CASCADE`).
    *   `frequency` (`numeric`): Probability rating indicating how frequently the question is asked (e.g. `100.0`, `87.5`).
    *   `created_at` (`timestamp with time zone`, default: `now()`).
*   **Constraints:** Unique composite key `(company_id, question_id)`.

### `user_progress` (Completed Exercises)
*   **Purpose:** Tracks which problems a user has completed.
*   **Columns:**
    *   `id` (`bigint`, Primary Key, Auto-increment).
    *   `user_id` (`uuid`, Foreign Key referencing `auth.users.id`, `ON DELETE CASCADE`).
    *   `question_id` (`integer`, Foreign Key referencing `questions.ID`, `ON DELETE CASCADE`).
    *   `completed` (`boolean`, default: `true`).
    *   `completed-at` (`timestamp with time zone`, default: `now()`).

### `sheet_questions` (Flagship Roadmap Mappings)
*   **Purpose:** Junction table mapping questions to SheetStride Core roadmap modules.
*   **Columns:**
    *   `Sheet_order` (`integer`): Relative position order in the sheet.
    *   `question ID` (`integer`, Foreign Key referencing `questions.ID`, `ON DELETE CASCADE`).
    *   `question name` (`text`): Mapped question title.
    *   `Pattern name` (`text`): Algorithm pattern category.
    *   `topic name` (`text`): Master roadmap topic parent.

### `pattern_metadata` (Handbook Blueprints)
*   **Purpose:** Holds markdown summaries, complex specs, and code templates for roadmap patterns.
*   **Columns:**
    *   `id` (`uuid`, Primary Key).
    *   `pattern_name` (`text`): Unique name matching patterns.
    *   `topic_name` (`text`): Parent topic reference.
    *   `core_idea` (`text`): Core algorithm logic text description.
    *   `recognition_keywords` (`json`): Key phrases indicating when to apply the pattern.
    *   `tc` (`text`): Typical time complexity (e.g. `O(N)`).
    *   `sc` (`text`): Typical space complexity (e.g. `O(1)`).
    *   `difficulty` (`text`): Difficulty categorizations (`Beginner`, `Intermediate`, `Advanced`).
    *   `cpp_template` (`text`): Code template in C++.

---

## 3. Database Views

### `view_sheet_questions`
Exposes joined questions metadata for SheetStride Core sections.
```sql
SELECT 
  sq.Sheet_order,
  sq."question ID" AS question_id,
  sq."question name" AS title,
  sq."Pattern name" AS pattern_name,
  sq."topic name" AS topic_name,
  q."Difficulty" AS difficulty,
  q."Link" AS link,
  q."Topics" AS topics,
  q."Acceptance Rate (%)" AS acceptance_rate
FROM public.sheet_questions sq
JOIN public.questions q ON sq."question ID" = q."ID";
```

### `view_company_summary`
Summarizes company sheet question counts for card cards and search indexes.
```sql
SELECT 
  c.id AS company_id,
  c.company_name,
  c.slug AS company_slug,
  COUNT(cq.question_id)::integer AS question_count
FROM public.companies c
LEFT JOIN public.company_questions cq ON c.id = cq.company_id
GROUP BY c.id, c.company_name, c.slug;
```

### `view_company_questions`
Exposes joined question meta and frequency counts for detail sheets.
```sql
SELECT 
  cq.company_id,
  c.company_name,
  c.slug AS company_slug,
  cq.question_id,
  q."Title" AS title,
  q."Difficulty" AS difficulty,
  q."Link" AS link,
  q."Topics" AS topics,
  q."Acceptance Rate (%)" AS acceptance_rate,
  cq.frequency
FROM public.company_questions cq
JOIN public.companies c ON cq.company_id = c.id
JOIN public.questions q ON cq.question_id = q."ID";
```

---

## 4. Custom Database Functions (RPCs)

### `calculate_user_streaks`
*   **Signature:** `calculate_user_streaks(target_user_id uuid)`
*   **Returns:** `TABLE(res_current_streak integer, res_max_streak integer)`
*   **Behavior:** Examines dates from `user_progress` for the given user, tracks consecutive days where at least one problem was marked as completed, and returns the current active and all-time highest streaks.

---

## 5. Row-Level Security (RLS) Policies

To protect database writes and allow public reading of curriculum roadmap definitions, Row-Level Security (RLS) policies are active on the database tables:

### A. User Tracking Tables (Write Protected)

#### `user_progress`
* **RLS status:** Enabled
* **Select Policy:** `auth.uid() = user_id` (Users can only read progress records belonging to their account)
* **Insert Policy:** `auth.uid() = user_id` (Users can only write completion logs matching their authenticated user ID)
* **Update Policy:** `auth.uid() = user_id` (Users can only update their own progress records)
* **Delete Policy:** `auth.uid() = user_id` (Users can only delete progress records for their own user ID)

#### `profiles` (Mirror profiles)
* **RLS status:** Enabled
* **Select Policy:** `true` (Allows public profiles to be read)
* **Insert/Update Policy:** `auth.uid() = id` (Users can only insert or update their own profile columns)

### B. Master Curriculum Tables (Read-Only)

The master roadmaps and questions database tables are secured using RLS but allow public SELECT privileges to both `anon` and `authenticated` roles:

#### `questions`, `companies`, `company_questions`, `sheet_questions`, `pattern_metadata`
* **RLS status:** Enabled
* **Select Policy:** `true` (Allows SELECT access for `public` role, covering both `anon` and `authenticated` roles)
* **Insert/Update/Delete Policies:** Denied by default (Write operations restricted to backend/superusers)

