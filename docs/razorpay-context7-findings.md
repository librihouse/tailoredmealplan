# Razorpay Context7 Documentation Findings

## Date: 2024-12-XX

## Key Findings from Context7 Queries

### 1. Payment Flow Architecture

#### Handler vs Callback URL
- **Handler**: Used for non-3D Secure payments. Called directly by Razorpay checkout.js when payment succeeds.
- **Callback URL**: Required for 3D Secure/OTP payments. Razorpay redirects to this URL after OTP verification.

#### Important Notes:
- For 3D Secure payments, Razorpay redirects to `callback_url` with payment data as POST form data
- The callback URL must handle POST requests with form data containing:
  - `razorpay_payment_id`
  - `razorpay_order_id`
  - `razorpay_signature`
  - `razorpay_payment_link_status` (optional, indicates failure)

### 2. OTP/3D Secure Payment Flow

From Context7 documentation:
- OTP is handled server-side via API calls (`otpGenerate`, `otpSubmit`)
- For frontend checkout.js integration, OTP is handled automatically by Razorpay
- After OTP verification, Razorpay redirects to `callback_url` with payment data

### 3. Payment Verification

#### Signature Verification
- Must verify signature using: `order_id|payment_id` with HMAC-SHA256
- Current implementation in `server/services/razorpay.ts` appears correct

#### Payment Status Check
- Payment status should be `captured` or `authorized` for successful payments
- Current implementation checks this correctly

### 4. Webhooks vs Callback URL

- **Webhooks**: Server-to-server notifications for payment events (async)
- **Callback URL**: Browser redirect after payment completion (synchronous)
- For checkout.js integration, callback URL is the primary mechanism for handling payment completion

### 5. Test Mode Configuration

- Test mode uses test API keys (starting with `rzp_test_`)
- Test cards are available for domestic INR payments
- Currency must match the account configuration (INR for domestic)

## Implementation Recommendations

### Current Implementation Analysis

#### ✅ Correct:
1. Using both `handler` and `callback_url` in checkout options
2. Signature verification logic
3. Payment status validation
4. HTML redirect page in callback route to prevent blank page

#### ⚠️ Potential Issues:
1. Callback URL might not be receiving POST data correctly
2. Form data parsing might need improvement
3. Error handling for failed payments in callback
4. SessionStorage cleanup timing

### Recommended Fixes

1. **Improve Callback Route**:
   - Ensure proper form data parsing
   - Add better error handling for missing fields
   - Validate all required parameters before redirecting

2. **Enhance Error Handling**:
   - Check `razorpay_payment_link_status` for failures
   - Provide clear error messages
   - Redirect to failure page with proper error context

3. **SessionStorage Management**:
   - Clear sessionStorage after successful payment
   - Handle cases where sessionStorage is cleared prematurely

4. **Payment Processing Page**:
   - Add retry logic for failed verifications
   - Improve error messages
   - Better handling of missing payment data

## Test Cards for Domestic INR Payments

Razorpay test cards for INR:
- Card Number: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: 1234 (for test mode)

## References

- Razorpay Node.js SDK: `/razorpay/razorpay-node`
- Razorpay Website Docs: `/websites/razorpay`
- Payment Verification: Uses HMAC-SHA256 signature validation
- OTP Flow: Handled automatically by Razorpay checkout.js

