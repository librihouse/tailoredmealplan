"use client";

/**
 * Payment Processing Page
 * Handles payment verification after Razorpay checkout
 * 
 * This page receives payment data from:
 * 1. URL parameters (from Razorpay handler redirect)
 * 2. SessionStorage (as backup)
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Spinner } from "@/components/ui/spinner";
import { verifyRazorpayPayment } from "@/lib/api";
import { PaymentErrorBoundary } from "@/components/PaymentErrorBoundary";

function PaymentProcessingContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "processing" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hasProcessed, setHasProcessed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    // Prevent double processing
    if (hasProcessed) return;
    
    const processPayment = async (isRetry = false) => {
      if (!isRetry) {
        setHasProcessed(true);
      }
      setStatus("processing");
      
      console.log("====== PAYMENT PROCESSING PAGE LOADED ======");
      console.log("URL:", window.location.href);
      console.log("Search params:", window.location.search);
      console.log("Retry attempt:", retryCount);

      try {
        // Step 1: Get payment data from URL parameters
        let razorpay_payment_id = searchParams.get("razorpay_payment_id");
        let razorpay_order_id = searchParams.get("razorpay_order_id");
        let razorpay_signature = searchParams.get("razorpay_signature");

        console.log("URL params:", {
          payment_id: razorpay_payment_id ? "present" : "missing",
          order_id: razorpay_order_id ? "present" : "missing",
          signature: razorpay_signature ? "present" : "missing",
        });

        // Fallback: Try window.location.search directly
        if (!razorpay_payment_id) {
          const urlParams = new URLSearchParams(window.location.search);
          razorpay_payment_id = urlParams.get("razorpay_payment_id");
          razorpay_order_id = urlParams.get("razorpay_order_id");
          razorpay_signature = urlParams.get("razorpay_signature");
          console.log("Fallback URL params:", {
            payment_id: razorpay_payment_id ? "present" : "missing",
            order_id: razorpay_order_id ? "present" : "missing",
            signature: razorpay_signature ? "present" : "missing",
          });
        }

        // Step 2: Get plan data from sessionStorage
        let planId: string | undefined;
        let billingInterval: string | undefined;
        
        const storedData = sessionStorage.getItem("razorpay_payment_data");
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            planId = parsed.planId;
            billingInterval = parsed.billingInterval;
            
            // If URL params are missing, try to get from sessionStorage
            if (!razorpay_payment_id) {
              razorpay_payment_id = parsed.razorpay_payment_id;
              razorpay_order_id = parsed.razorpay_order_id;
              razorpay_signature = parsed.razorpay_signature;
              console.log("Using payment data from sessionStorage");
            }
            
            console.log("Plan data from sessionStorage:", { planId, billingInterval });
          } catch (e) {
            console.error("Error parsing sessionStorage data:", e);
          }
        } else {
          console.log("No data in sessionStorage");
        }

        // Step 3: Validate required data
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
          throw new Error("Payment data not found. Please try the payment again.");
        }

        if (!planId || !billingInterval) {
          throw new Error("Plan information not found. Please try the payment again.");
        }

        console.log("Verifying payment with backend...");

        // Step 4: Verify payment with backend
        console.log("Verifying payment with backend...");
        console.log("Payment details:", {
          payment_id: razorpay_payment_id?.substring(0, 10) + "...",
          order_id: razorpay_order_id?.substring(0, 10) + "...",
          plan_id: planId,
          billing_interval: billingInterval,
        });

        let result;
        try {
          result = await verifyRazorpayPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId,
            billingInterval: billingInterval as "monthly" | "annual",
          });
        } catch (verifyError: any) {
          console.error("Payment verification API error:", verifyError);
          // Retry on network errors
          if (retryCount < MAX_RETRIES && (verifyError.message?.includes("network") || verifyError.message?.includes("fetch"))) {
            console.log(`Retrying payment verification (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            setRetryCount(retryCount + 1);
            setTimeout(() => {
              processPayment(true);
            }, 2000);
            return;
          }
          throw verifyError;
        }

        console.log("Verification result:", result);

        if (!result?.success) {
          const errorMsg = result?.message || "Payment verification failed";
          console.error("Payment verification failed:", errorMsg);
          
          // Retry on certain errors
          if (retryCount < MAX_RETRIES && errorMsg.includes("timeout")) {
            console.log(`Retrying payment verification (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            setRetryCount(retryCount + 1);
            setTimeout(() => {
              processPayment(true);
            }, 2000);
            return;
          }
          
          throw new Error(errorMsg);
        }

        // Step 5: Success - clear storage and redirect
        console.log("Payment verified successfully!");
        sessionStorage.removeItem("razorpay_payment_data");
        setStatus("success");

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);

      } catch (error: any) {
        console.error("====== PAYMENT PROCESSING ERROR ======");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Retry count:", retryCount);
        
        setStatus("error");
        const errorMsg = error.message || "Payment processing failed";
        setErrorMessage(errorMsg);
        
        // Don't redirect immediately - show error to user first
        // They can manually retry or we'll auto-redirect after delay
        console.log("Will redirect to failure page in 3 seconds...");
        
        setTimeout(() => {
          const failureUrl = `/payment/failure?error=${encodeURIComponent(errorMsg)}`;
          console.log("Redirecting to:", failureUrl);
          window.location.href = failureUrl;
        }, 3000);
      }
    };

    // Start processing after a small delay to ensure page is mounted
    const timer = setTimeout(() => processPayment(false), 100);
    return () => clearTimeout(timer);
  }, [searchParams, hasProcessed, retryCount]);

  // Render based on status
  if (status === "error") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center space-y-4 max-w-md px-4">
            <div className="text-red-500 text-6xl mb-4">✕</div>
            <h2 className="text-2xl font-bold">Payment Error</h2>
            <p className="text-gray-400">{errorMessage}</p>
            <p className="text-sm text-gray-500 mt-4">
              {retryCount > 0 && `Retried ${retryCount} time(s). `}
              Redirecting to failure page...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === "success") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center space-y-4">
            <div className="text-primary text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-gray-400">Redirecting to your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading / Processing state
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-6">
          <Spinner className="h-12 w-12 text-primary mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {status === "loading" ? "Loading..." : "Processing Payment"}
            </h2>
            <p className="text-gray-400">
              Please wait while we verify your payment...
            </p>
          </div>
          <p className="text-sm text-gray-500">This may take a few seconds</p>
        </div>
      </div>
    </Layout>
  );
}

function ProcessingFallback() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-6">
          <Spinner className="h-12 w-12 text-primary mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function PaymentProcessingPage() {
  return (
    <PaymentErrorBoundary>
      <Suspense fallback={<ProcessingFallback />}>
        <PaymentProcessingContent />
      </Suspense>
    </PaymentErrorBoundary>
  );
}
