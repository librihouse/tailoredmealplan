/**
 * POST /api/razorpay/callback
 * Handle Razorpay callback after payment (3D Secure redirect)
 * Razorpay POSTs payment data here after 3D Secure verification
 * Returns an HTML page that performs client-side redirect to avoid blank page issues
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/server/services/razorpay";

/**
 * Generate error HTML page for redirect
 */
function generateErrorHtml(origin: string, errorMessage: string): string {
  const encodedError = encodeURIComponent(errorMessage);
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Error</title>
        <meta http-equiv="refresh" content="0;url=${origin}/payment/failure?error=${encodedError}">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #000;
            color: #fff;
          }
        </style>
      </head>
      <body>
        <p>Redirecting...</p>
        <script>
          window.location.replace("${origin}/payment/failure?error=${encodedError}");
        </script>
      </body>
    </html>
  `;
}

/**
 * Generate success redirect HTML page
 */
function generateSuccessHtml(origin: string, processingUrl: string): string {
  // CRITICAL: This HTML must be returned immediately by Razorpay callback
  // Any delay causes Razorpay to redirect to about:blank
  // Using both meta refresh and JavaScript redirect for maximum compatibility
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Processing Payment...</title>
  <meta http-equiv="refresh" content="0;url=${processingUrl}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #000;
      color: #fff;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 20px;
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid #10b981;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    p {
      margin-top: 10px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Processing your payment...</p>
  </div>
  <script>
    // CRITICAL: Immediate redirect to prevent blank page
    // Use replace() to avoid back button issues
    // Multiple redirect methods for maximum compatibility
    (function() {
      try {
        // Primary: window.location.replace (most reliable)
        window.location.replace("${processingUrl}");
      } catch (e) {
        // Fallback: window.location.href
        try {
          window.location.href = "${processingUrl}";
        } catch (e2) {
          // Last resort: top.location
          top.location.href = "${processingUrl}";
        }
      }
    })();
  </script>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  // CRITICAL: Return HTML immediately to prevent blank page
  // Razorpay expects an immediate HTML response from callback_url
  // Any delay or error causes it to redirect to about:blank
  // DO NOT add any async operations before returning the response
  
  const origin = request.nextUrl.origin;
  
  try {
    console.log("[Razorpay Callback] ====== POST REQUEST RECEIVED ======");
    console.log("[Razorpay Callback] URL:", request.url);
    console.log("[Razorpay Callback] Origin:", origin);
    console.log("[Razorpay Callback] Content-Type:", request.headers.get("content-type"));
    
    // Parse form data from Razorpay POST
    // Razorpay sends payment data as application/x-www-form-urlencoded
    let formData: FormData;
    try {
      // Read the raw body first to ensure we can parse it
      const contentType = request.headers.get("content-type") || "";
      console.log("[Razorpay Callback] Content-Type:", contentType);
      
      formData = await request.formData();
    } catch (formError: any) {
      console.error("[Razorpay Callback] Error parsing form data:", formError);
      // Return error page immediately - don't try other parsing methods
      // as Razorpay expects immediate HTML response
      return new NextResponse(
        generateErrorHtml(origin, "Unable to parse payment data from Razorpay"),
        {
          status: 200,
          headers: { 
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }
    
    const razorpay_payment_id = formData.get("razorpay_payment_id") as string;
    const razorpay_order_id = formData.get("razorpay_order_id") as string;
    const razorpay_signature = formData.get("razorpay_signature") as string;
    const razorpay_payment_link_id = formData.get("razorpay_payment_link_id") as string;
    const razorpay_payment_link_reference_id = formData.get("razorpay_payment_link_reference_id") as string;
    const razorpay_payment_link_status = formData.get("razorpay_payment_link_status") as string;

    console.log("[Razorpay Callback] Received POST data:", {
      hasPaymentId: !!razorpay_payment_id,
      hasOrderId: !!razorpay_order_id,
      hasSignature: !!razorpay_signature,
      paymentId: razorpay_payment_id?.substring(0, 10) + "...",
      orderId: razorpay_order_id?.substring(0, 10) + "...",
      paymentLinkStatus: razorpay_payment_link_status,
      allFormKeys: Array.from(formData.keys()),
    });

    // Check if this is a payment failure (Razorpay sends failure data differently)
    if (razorpay_payment_link_status === "failed") {
      console.log("[Razorpay Callback] Payment failed - payment_link_status is 'failed'");
      return new NextResponse(
        generateErrorHtml(origin, "Payment failed. Please try again or contact support."),
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Validate required payment data
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.error("[Razorpay Callback] Missing required payment data:", {
        hasPaymentId: !!razorpay_payment_id,
        hasOrderId: !!razorpay_order_id,
        hasSignature: !!razorpay_signature,
      });
      return new NextResponse(
        generateErrorHtml(origin, "Missing payment data from Razorpay. Please try the payment again."),
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Verify signature to ensure payment data integrity
    console.log("[Razorpay Callback] Verifying payment signature...");
    let isValid: boolean;
    try {
      isValid = verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
    } catch (verifyError: any) {
      console.error("[Razorpay Callback] Error during signature verification:", verifyError);
      return new NextResponse(
        generateErrorHtml(origin, "Payment signature verification failed. Please contact support."),
        {
          status: 200,
          headers: { 
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    if (!isValid) {
      console.error("[Razorpay Callback] Invalid payment signature");
      return new NextResponse(
        generateErrorHtml(origin, "Invalid payment signature. Payment may have been tampered with."),
        {
          status: 200,
          headers: { 
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    console.log("[Razorpay Callback] Payment signature verified successfully");

    // Build processing URL with payment data
    const processingUrl = `${origin}/payment/processing?razorpay_payment_id=${encodeURIComponent(razorpay_payment_id)}&razorpay_order_id=${encodeURIComponent(razorpay_order_id)}&razorpay_signature=${encodeURIComponent(razorpay_signature)}`;

    console.log("[Razorpay Callback] Redirecting to processing page:", processingUrl);

    // Return HTML page that performs client-side redirect to processing page
    // This prevents the blank page issue after OTP/3D Secure verification
    // CRITICAL: Return immediately with proper headers to prevent about:blank
    return new NextResponse(
      generateSuccessHtml(origin, processingUrl),
      {
        status: 200,
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    console.error("[Razorpay Callback] ====== UNEXPECTED ERROR ======");
    console.error("[Razorpay Callback] Error message:", error?.message);
    console.error("[Razorpay Callback] Error stack:", error?.stack);
    return new NextResponse(
      generateErrorHtml(
        origin,
        `Payment processing error: ${error?.message || "Unknown error occurred"}`
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}

// Also handle GET requests (fallback if Razorpay sends GET instead of POST)
// Note: Razorpay typically sends POST, but GET is supported as fallback
export async function GET(request: NextRequest) {
  console.log("[Razorpay Callback] ====== GET REQUEST RECEIVED (FALLBACK) ======");
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  
  const razorpay_payment_id = searchParams.get("razorpay_payment_id");
  const razorpay_order_id = searchParams.get("razorpay_order_id");
  const razorpay_signature = searchParams.get("razorpay_signature");

  console.log("[Razorpay Callback GET] Received params:", {
    hasPaymentId: !!razorpay_payment_id,
    hasOrderId: !!razorpay_order_id,
    hasSignature: !!razorpay_signature,
  });

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return new NextResponse(
      generateErrorHtml(origin, "Missing payment data. Please try the payment again."),
      {
        status: 200,
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  // Verify signature
  try {
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return new NextResponse(
        generateErrorHtml(origin, "Invalid payment signature."),
        {
          status: 200,
          headers: { 
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }
  } catch (verifyError: any) {
    console.error("[Razorpay Callback GET] Signature verification error:", verifyError);
    return new NextResponse(
      generateErrorHtml(origin, "Payment verification failed."),
      {
        status: 200,
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  // Build processing URL
  const processingUrl = `${origin}/payment/processing?razorpay_payment_id=${encodeURIComponent(razorpay_payment_id)}&razorpay_order_id=${encodeURIComponent(razorpay_order_id)}&razorpay_signature=${encodeURIComponent(razorpay_signature)}`;

  console.log("[Razorpay Callback GET] Redirecting to processing page:", processingUrl);

  return new NextResponse(
    generateSuccessHtml(origin, processingUrl),
    {
      status: 200,
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}

