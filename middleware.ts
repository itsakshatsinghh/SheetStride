import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Extract tokens from cookies
  let accessToken = request.cookies.get("sb-access-token")?.value;
  let refreshToken = request.cookies.get("sb-refresh-token")?.value;

  let isValid = false;

  if (accessToken) {
    const payload = parseJwt(accessToken);
    if (payload && payload.exp * 1000 > Date.now()) {
      isValid = true;
    }
  }

  // Attempt token refresh via REST API if expired but refresh token exists
  if (!isValid && refreshToken) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token && data.refresh_token) {
          accessToken = data.access_token;
          refreshToken = data.refresh_token;
          isValid = true;

          const nextResponse = NextResponse.next();
          // Write updated tokens back to browser cookies
          nextResponse.cookies.set("sb-access-token", data.access_token, {
            path: "/",
            maxAge: data.expires_in,
            sameSite: "lax",
            secure: true,
          });
          nextResponse.cookies.set("sb-refresh-token", data.refresh_token, {
            path: "/",
            maxAge: 604800,
            sameSite: "lax",
            secure: true,
          });
          return nextResponse;
        }
      }
    } catch (error) {
      console.error("Token refresh failed in middleware:", error);
    }
  }

  // Unauthenticated users trying to access matched paths are redirected to "/"
  if (!isValid) {
    const loginUrl = new URL("/", request.url);
    const nextResponse = NextResponse.redirect(loginUrl);
    nextResponse.cookies.delete("sb-access-token");
    nextResponse.cookies.delete("sb-refresh-token");
    return nextResponse;
  }

  return NextResponse.next();
}

// Config matcher to only run middleware on secured dashboard, profile, and settings paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
