# Razorpay Test Configuration Checklist

## Environment Variables Required

Ensure the following variables are set in `.env.local`:

```bash
# Razorpay Test Keys (for domestic INR payments)
RAZORPAY_KEY_ID=rzp_test_<your_test_key_id>
RAZORPAY_KEY_SECRET=<your_test_key_secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_<your_test_key_id>
```

## Verification Steps

1. **Check Key Format**:
   - Test keys should start with `rzp_test_`
   - Both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` should match
   - `RAZORPAY_KEY_SECRET` should be the corresponding secret

2. **Currency Configuration**:
   - Currently set to `INR` in `server/config/razorpay-plans.ts`
   - All plan amounts are in paise (smallest INR unit)
   - Example: ₹799 = 79900 paise

3. **Test Cards for INR Payments**:
   - **Card Number**: 4111 1111 1111 1111
   - **CVV**: Any 3 digits (e.g., 123)
   - **Expiry**: Any future date (e.g., 12/25)
   - **OTP**: 1234 (for test mode)

## Current Configuration Status

✅ Currency: INR (domestic payments)
✅ Plans configured with INR amounts in paise
✅ Callback URL: `/api/razorpay/callback`
✅ Processing page: `/payment/processing`

## Testing Checklist

- [ ] Test keys are set in `.env.local`
- [ ] Test keys start with `rzp_test_`
- [ ] Server restarted after updating `.env.local`
- [ ] Test with non-3D Secure card (should use handler)
- [ ] Test with 3D Secure card (should use callback URL)
- [ ] Verify payment redirects to `/payment/processing`
- [ ] Verify payment verification completes
- [ ] Verify credits are allocated in database
- [ ] Verify redirect to dashboard after success

## Troubleshooting

### Blank Page After OTP
- Check browser console for errors
- Check server logs for callback POST requests
- Verify callback URL is accessible
- Check that callback route returns HTML with redirect

### Payment Verification Fails
- Check server logs for verification errors
- Verify signature verification logic
- Check payment status in Razorpay dashboard
- Verify test keys are correct

### Missing Payment Data
- Check sessionStorage in browser DevTools
- Verify URL parameters are present
- Check callback route receives POST data correctly

