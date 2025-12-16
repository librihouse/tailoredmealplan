/**
 * Razorpay Frontend Integration
 * Handles Razorpay checkout and payment processing
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
  amount: number;
  currency: string;
  planName: string;
  userEmail: string;
  userName: string;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

/**
 * Open Razorpay checkout modal
 */
export const openRazorpayCheckout = async (options: RazorpayCheckoutOptions) => {
  try {
    const Razorpay = await loadRazorpay();
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      throw new Error("Razorpay key ID is not configured");
    }

    const rzp = new Razorpay({
      key: razorpayKeyId,
      amount: options.amount,
      currency: options.currency,
      name: "TailoredMealPlan",
      description: options.planName,
      order_id: options.orderId,
      handler: options.onSuccess,
      prefill: {
        email: options.userEmail,
        name: options.userName,
      },
      theme: {
        color: "#10b981", // Primary green color
      },
      modal: {
        ondismiss: () => {
          options.onFailure({ reason: "dismissed" });
        },
      },
    });

    rzp.open();
  } catch (error: any) {
    console.error("Error opening Razorpay checkout:", error);
    options.onFailure(error);
  }
};

