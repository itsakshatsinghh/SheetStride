import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing verification parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured on server" },
        { status: 500 }
      );
    }

    // HMAC-SHA256 signature verification
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(text)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({
        success: true,
        message: "Payment signature verified successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid signature verification mismatch" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error during payment verification:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
