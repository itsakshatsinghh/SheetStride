"use client";

import React, { useState } from "react";
import Script from "next/script";
import { AlertTriangle, CheckCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CoffeeButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCoffeeCheckout = async () => {
    if (status === "loading" || status === "success") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      // 1. Create order on backend via API
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 20000 }), // 200 INR (20000 paise)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create order");
      }

      const orderData = await res.json();

      // 2. Configure and open Razorpay standard checkout modal
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SheetStride support",
        description: "Fueling coding sessions with caffeine",
        order_id: orderData.id,
        handler: async function (response: any) {
          setStatus("loading");
          try {
            // 3. Post verification payload to the backend
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.error || "Verification failed");
            }

            setStatus("success");
            // Reset back to idle status after showing success state
            setTimeout(() => setStatus("idle"), 5000);
          } catch (verifyError: any) {
            console.error("Signature verification error:", verifyError);
            setStatus("error");
            setErrorMessage(verifyError?.message || "Signature check failed");
            setTimeout(() => setStatus("idle"), 4000);
          }
        },
        prefill: {
          name: "Developer",
          email: "developer@sheetstride.com",
        },
        theme: {
          color: "#2e5bff", // Brand sapphire color
        },
        modal: {
          ondismiss: function () {
            setStatus("idle");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Payment setup failure:", err);
      setStatus("error");
      setErrorMessage(err?.message || "Checkout failed");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="fixed bottom-6 right-6 z-[999] pointer-events-auto font-press-start">
        <button
          onClick={handleCoffeeCheckout}
          disabled={status === "loading"}
          className={`
            group flex items-center gap-3 px-4 py-3 rounded-lg border text-[10px] tracking-widest uppercase transition-all duration-300 active:scale-95 select-none backdrop-blur-md
            ${
              status === "idle"
                ? "bg-[#131313]/90 hover:bg-[#1c1c1c]/95 border-white/10 hover:border-tertiary text-text hover:text-tertiary hover:shadow-[0_0_15px_rgba(249,203,19,0.25)]"
                : ""
            }
            ${
              status === "loading"
                ? "bg-[#1c1c1c]/90 border-primary/40 text-primary/80 animate-pulse cursor-wait"
                : ""
            }
            ${
              status === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : ""
            }
            ${
              status === "error"
                ? "bg-rose-950/80 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                : ""
            }
          `}
        >
          {/* Custom Pixelated Coffee Cup Icon */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            {status === "idle" && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="group-hover:scale-110 transition-transform duration-200"
                style={{ imageRendering: "pixelated" }}
              >
                {/* Steam lines */}
                <rect x="4" y="1" width="1" height="2" className="opacity-70 group-hover:animate-pulse" />
                <rect x="7" y="0" width="1" height="2" className="opacity-70 group-hover:animate-pulse [animation-delay:0.15s]" />
                <rect x="10" y="1" width="1" height="2" className="opacity-70 group-hover:animate-pulse [animation-delay:0.3s]" />
                {/* Cup Rim */}
                <rect x="2" y="4" width="10" height="1" />
                {/* Cup Body */}
                <rect x="3" y="5" width="8" height="6" />
                <rect x="4" y="11" width="6" height="1" />
                {/* Handle */}
                <rect x="11" y="6" width="2" height="1" />
                <rect x="12" y="7" width="1" height="2" />
                <rect x="11" y="9" width="2" height="1" />
              </svg>
            )}

            {status === "loading" && (
              <svg
                className="animate-spin h-4.5 w-4.5 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}

            {status === "success" && (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}

            {status === "error" && (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
          </div>

          <div className="flex flex-col items-start leading-tight">
            {status === "idle" && (
              <>
                <span className="text-[7px] text-outline tracking-wider font-mono-label mb-0.5">SUPPORT_DEV_</span>
                <span className="text-xs group-hover:text-tertiary transition-colors">WHAT ABOUT A COFFEE?</span>
              </>
            )}

            {status === "loading" && (
              <>
                <span className="text-[7px] text-primary-strong tracking-wider font-mono-label mb-0.5">CONNECTING_GATEWAY_</span>
                <span className="text-xs">CREATING ORDER...</span>
              </>
            )}

            {status === "success" && (
              <>
                <span className="text-[7px] text-emerald-300 tracking-wider font-mono-label mb-0.5">CAFFEINE_INJECTED!</span>
                <span className="text-xs">+100 HP // THANK YOU!</span>
              </>
            )}

            {status === "error" && (
              <>
                <span className="text-[7px] text-rose-300 tracking-wider font-mono-label mb-0.5">TRANSACTION_FAILED_</span>
                <span className="text-[9px] truncate max-w-[150px]">{errorMessage || "TRY AGAIN"}</span>
              </>
            )}
          </div>
        </button>
      </div>
    </>
  );
}
