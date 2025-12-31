/**
 * Razorpay Frontend Integration
 * Handles Razorpay checkout and payment processing
 * 
 * IMPORTANT: For 3D Secure/OTP payments, Razorpay redirects to callback_url.
 * For non-3D Secure payments, the handler is called directly.
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Load Razorpay SDK dynamically
 */
export const loadRazorpay = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error("Razorpay SDK failed to load"));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.body.appendChild(script);
  });
};

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number | string;
  currency: string;
  planName: string;
  userEmail: string;
  userName: string;
  planId: string;
  billingInterval: "monthly" | "annual";
  onSuccess?: (response: any) => void;
  onFailure: (error: any) => void;
}

/**
 * Open Razorpay checkout modal
 */
export const openRazorpayCheckout = async (options: RazorpayCheckoutOptions) => {
  try {
    const Razorpay = await loadRazorpay();
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      throw new Error("Razorpay key ID is not configured");
    }

    // Store payment data in sessionStorage
    const paymentData = {
      planId: options.planId,
      billingInterval: options.billingInterval,
      orderId: options.orderId,
    };
    sessionStorage.setItem("razorpay_payment_data", JSON.stringify(paymentData));
    console.log("[Razorpay] Stored initial payment data in sessionStorage");

    // Build URLs
    const processingBaseUrl = `${window.location.origin}/payment/processing`;
    const callbackUrl = `${window.location.origin}/api/razorpay/callback`;

    // Handler for successful payment (non-3D Secure payments)
    // For 3D Secure/OTP payments, Razorpay will redirect to callback_url instead
    const handler = (response: any) => {
      console.log("[Razorpay] ====== PAYMENT HANDLER CALLED (Non-3D Secure) ======");
      console.log("[Razorpay] Payment response:", response);
      
      try {
        // Validate response
        if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
          console.error("[Razorpay] Invalid payment response - missing required fields");
          options.onFailure({ reason: "Invalid payment response" });
          return;
        }

        // Update sessionStorage with payment response
        try {
          const storedData = sessionStorage.getItem("razorpay_payment_data");
          const data = storedData ? JSON.parse(storedData) : {};
          const updatedData = {
            ...data,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };
          sessionStorage.setItem("razorpay_payment_data", JSON.stringify(updatedData));
          console.log("[Razorpay] Updated sessionStorage with payment response");
        } catch (storageError: any) {
          console.error("[Razorpay] Error updating sessionStorage:", storageError);
        }

        // Build processing URL with all payment data
        const processingUrl = new URL(processingBaseUrl);
        processingUrl.searchParams.set("razorpay_payment_id", response.razorpay_payment_id);
        processingUrl.searchParams.set("razorpay_order_id", response.razorpay_order_id);
        processingUrl.searchParams.set("razorpay_signature", response.razorpay_signature);

        console.log("[Razorpay] Redirecting to:", processingUrl.toString());

        // Use a small delay to ensure modal is fully closed
        setTimeout(() => {
          // Navigate to processing page
          window.location.href = processingUrl.toString();
        }, 100);
        
      } catch (error: any) {
        console.error("[Razorpay] Error in payment handler:", error);
        options.onFailure(error);
      }
    };

    // Razorpay configuration
    // IMPORTANT: callback_url is REQUIRED for 3D Secure/OTP payments
    // Without it, Razorpay redirects to about:blank after OTP verification
    // For 3D Secure payments, Razorpay will redirect to callback_url
    // For non-3D Secure payments, the handler will be called
    const rzpOptions: any = {
      key: razorpayKeyId,
      amount: typeof options.amount === 'string' ? parseInt(options.amount, 10) : options.amount,
      currency: options.currency,
      name: "TailoredMealPlan",
      description: options.planName,
      order_id: options.orderId,
      handler: handler, // For non-3D Secure payments
      callback_url: callbackUrl, // REQUIRED for 3D Secure/OTP payments - Razorpay will POST form data here
      prefill: {
        email: options.userEmail,
        name: options.userName,
      },
      notes: {
        planId: options.planId,
        billingInterval: options.billingInterval,
      },
      theme: {
        color: "#10b981",
      },
      modal: {
        ondismiss: () => {
          console.log("[Razorpay] Modal dismissed by user");
          sessionStorage.removeItem("razorpay_payment_data");
          options.onFailure({ reason: "dismissed" });
        },
        escape: true,
        backdropclose: false,
      },
      // Note: redirect option is not standard in Razorpay checkout.js
      // We rely on callback_url for 3D Secure and handler for non-3D Secure
    };

    console.log("[Razorpay] ====== OPENING CHECKOUT ======");
    console.log("[Razorpay] Key:", razorpayKeyId?.substring(0, 15) + "...");
    console.log("[Razorpay] Order ID:", options.orderId);
    console.log("[Razorpay] Amount:", rzpOptions.amount, rzpOptions.currency);
    console.log("[Razorpay] Callback URL:", callbackUrl);
    console.log("[Razorpay] Handler configured for non-3D Secure payments");
    console.log("[Razorpay] Callback URL configured for 3D Secure/OTP payments");

    const rzp = new Razorpay(rzpOptions);

    // Listen for payment failure events
    rzp.on('payment.failed', (response: any) => {
      console.error("[Razorpay] ====== PAYMENT FAILED EVENT ======");
      console.error("[Razorpay] Payment failed response:", response);
      sessionStorage.removeItem("razorpay_payment_data");
      
      const errorReason = response.error?.description || response.error?.reason || response.error?.code || "Payment failed";
      const failureUrl = `${window.location.origin}/payment/failure?error=${encodeURIComponent(errorReason)}`;
      
      console.log("[Razorpay] Redirecting to failure page:", failureUrl);
      
      // Use replace to avoid back button issues
      setTimeout(() => {
        window.location.replace(failureUrl);
      }, 100);
    });

    // Open the checkout modal
    rzp.open();
    console.log("[Razorpay] Checkout modal opened");
    
  } catch (error: any) {
    console.error("[Razorpay] Error opening checkout:", error);
    sessionStorage.removeItem("razorpay_payment_data");
    options.onFailure(error);
  }
};
