import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
    let amount = 20000; // Default: 200 INR (20000 paise)

    try {
      const body = await request.json();
      if (body && typeof body.amount === "number") {
        // Validate minimum amount is 100 paise (1 INR)
        amount = Math.max(100, body.amount);
      }
    } catch {
      // Gracefully fallback to default amount if request body is empty/invalid
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `coffee_rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
