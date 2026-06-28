import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://alfa-leetcode-api.onrender.com/contests/upcoming", {
      next: { revalidate: 3600 } // Cache on the server for 1 hour
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("Failed to proxy contests from Alfa API:", err);
  }
  return NextResponse.json({ count: 0, contests: [] });
}
