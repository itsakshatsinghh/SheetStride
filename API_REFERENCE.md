# Project Memory: API_REFERENCE.md (API Documentation)

This document provides a reference for all internal endpoints and direct database interface APIs utilized in SheetStride.

---

## 1. Next.js API Routes (Razorpay Integration)

### POST `/api/create-order`
*   **Purpose:** Initializes a payment/donation transaction by creating an order with the Razorpay API.
*   **Authentication Requirements:** Publicly accessible (No authentication token required).
*   **Dependencies:**
    *   `razorpay` library (v2.9.6)
    *   Environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
*   **Request Format:**
    *   **Method:** `POST`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (Optional JSON):**
        ```json
        {
          "amount": 20000
        }
        ```
        *Note: `amount` must be specified in the lowest currency unit (paise for INR). Default is `20000` (200 INR). Minimum validated amount is `100` (1 INR).*
*   **Response Format:**
    *   **Status Code:** `200 OK`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):**
        ```json
        {
          "id": "order_HjF92Lsk29Smd9",
          "amount": 20000,
          "currency": "INR",
          "key": "rzp_test_publickeyhere"
        }
        ```
    *   **Error Responses:**
        *   **Status Code:** `500 Internal Server Error`
        *   **Body (JSON):**
            ```json
            {
              "error": "Error message explanation"
            }
            ```

---

### POST `/api/verify-payment`
*   **Purpose:** Validates the cryptographic signature returned by Razorpay after a user completes checkout to ensure integrity.
*   **Authentication Requirements:** Publicly accessible (No authentication token required).
*   **Dependencies:**
    *   Node native `crypto` module (HMAC-SHA256 hash generator).
    *   Environment variables: `RAZORPAY_KEY_SECRET`.
*   **Request Format:**
    *   **Method:** `POST`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (Required JSON):**
        ```json
        {
          "razorpay_order_id": "order_HjF92Lsk29Smd9",
          "razorpay_payment_id": "pay_HjFDs7sd87sa9",
          "razorpay_signature": "d9822a10df..."
        }
        ```
*   **Response Format:**
    *   **Status Code:** `200 OK`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):**
        ```json
        {
          "success": true,
          "message": "Payment signature verified successfully"
        }
        ```
    *   **Error Responses:**
        *   **Status Code:** `400 Bad Request` (Missing parameters or signature verification mismatch):
            ```json
            {
              "success": false,
              "error": "Invalid signature verification mismatch"
            }
            ```
        *   **Status Code:** `500 Internal Server Error` (Secret key missing on server or runtime crash):
            ```json
            {
              "error": "Razorpay secret key not configured on server"
            }
            ```

---

## 2. Supabase Client Queries & DB Interfaces

Since SheetStride utilizes Supabase, the majority of database queries are executed directly on the client using the `@supabase/supabase-js` API.

### A. Toggle Question Solve Status
*   **Tables Targeted:** `user_progress`
*   **Inserting Progress:**
    ```typescript
    await supabase
      .from("user_progress")
      .insert({
        user_id: userId,
        question_id: questionId,
        completed: true
      });
    ```
*   **Deleting Progress:**
    ```typescript
    await supabase
      .from("user_progress")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);
    ```

### B. Retrieve Company Index Summaries
*   **Views Targeted:** `view_company_summary`
*   **Query Description:** Fetches all company names, slugs, and total questions available in their respective interview sheets. Used on the main Company Sheets Hub page.
*   **Fetch Script:**
    ```typescript
    await supabase
      .from("view_company_summary")
      .select("*")
      .order("company_name", { ascending: true });
    ```

### C. Retrieve Company Specific Question List
*   **Views Targeted:** `view_company_questions`
*   **Query Description:** Fetches questions for a specific company by slug. Ordered by frequency of occurrence in descending order.
*   **Fetch Script:**
    ```typescript
    await supabase
      .from("view_company_questions")
      .select("*")
      .eq("company_slug", companySlug)
      .order("frequency", { ascending: false });
    ```

### D. Fetch Paginated Master Questions (LeetCode Universe)
*   **Tables Targeted:** `questions`
*   **Query Description:** Pulls Master LeetCode questions using pagination (`.range()`) to avoid the Postgrest 1,000 row restriction.
*   **Fetch Script:**
    ```typescript
    await supabase
      .from("questions")
      .select("*")
      .range(startIndex, endIndex);
    ```

### E. Fetch User Streak Analytics (RPC Call)
*   **RPC Method Name:** `calculate_user_streaks`
*   **Query Description:** Executes the database function calculating current and all-time maximum solve streaks for a specific user ID.
*   **Fetch Script:**
    ```typescript
    await supabase.rpc("calculate_user_streaks", {
      target_user_id: userId
    });
    ```
