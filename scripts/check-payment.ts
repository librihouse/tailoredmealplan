/**
 * Script to check Razorpay payment details and failure reasons
 * Usage: npx tsx scripts/check-payment.ts <payment_id>
 */

import Razorpay from "razorpay";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const paymentId = process.argv[2] || "pay_Ry7nWV1SyS9Z3h";

async function checkPayment() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("Razorpay credentials not found in .env.local");
    console.log("Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set");
    process.exit(1);
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    console.log("\nFetching payment details for:", paymentId);
    console.log("");
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    console.log("==========================================");
    console.log("PAYMENT DETAILS");
    console.log("==========================================");
    console.log("Payment ID:", payment.id);
    console.log("Status:", payment.status);
    console.log("Amount:", (payment.amount / 100), payment.currency);
    console.log("Order ID:", payment.order_id);
    console.log("Created At:", new Date(payment.created_at * 1000).toLocaleString());
    console.log("");
    
    if (payment.status === "failed") {
      console.log("PAYMENT FAILED");
      console.log("==========================================");
      console.log("Error Code:", payment.error_code || "N/A");
      console.log("Error Description:", payment.error_description || "N/A");
      console.log("Error Source:", payment.error_source || "N/A");
      console.log("Error Step:", payment.error_step || "N/A");
      console.log("Error Reason:", payment.error_reason || "N/A");
      
      if (payment.error_metadata) {
        console.log("\nError Metadata:", JSON.stringify(payment.error_metadata, null, 2));
      }
      
      console.log("\n==========================================");
      console.log("ANALYSIS:");
      console.log("==========================================");
      
      const reason = (payment.error_reason || payment.error_description || "").toLowerCase();
      if (reason.includes("insufficient") || reason.includes("fund")) {
        console.log("Likely cause: Insufficient funds in the card");
      } else if (reason.includes("declined") || reason.includes("rejected")) {
        console.log("Likely cause: Card declined by bank");
      } else if (reason.includes("expired")) {
        console.log("Likely cause: Card expired");
      } else if (reason.includes("invalid") || reason.includes("incorrect")) {
        console.log("Likely cause: Invalid card details");
      } else if (reason.includes("3d") || reason.includes("authentication")) {
        console.log("Likely cause: 3D Secure authentication failed");
      } else if (reason.includes("limit") || reason.includes("exceeded")) {
        console.log("Likely cause: Transaction limit exceeded");
      } else if (reason.includes("blocked") || reason.includes("restricted")) {
        console.log("Likely cause: Card is blocked or restricted");
      } else {
        console.log("Check the error description above for details");
      }
    } else if (payment.status === "captured" || payment.status === "authorized") {
      console.log("PAYMENT SUCCESSFUL");
      console.log("==========================================");
    } else {
      console.log("Payment Status:", payment.status);
    }
    
    console.log("\n==========================================");
    console.log("ADDITIONAL INFO");
    console.log("==========================================");
    console.log("Method:", payment.method || "N/A");
    console.log("International:", payment.international ? "Yes" : "No");
    console.log("Email:", payment.email || "N/A");
    console.log("Contact:", payment.contact || "N/A");
    console.log("\nFull Payment Object:");
    console.log(JSON.stringify(payment, null, 2));
    
  } catch (error: any) {
    console.error("\nError fetching payment details:");
    console.error(error.message);
    if (error.error) {
      console.error("Razorpay Error:", JSON.stringify(error.error, null, 2));
    }
    process.exit(1);
  }
}

checkPayment();
