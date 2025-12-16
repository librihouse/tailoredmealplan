# Migration Guide: Hybrid Pricing Structure Implementation

This guide covers the implementation of the new hybrid pricing structure with separate weekly and monthly plan quotas.

## Overview

The new pricing structure separates weekly plans (1-7 days) from monthly plans (30 days) to better align with API costs. Monthly plans cost ~10x more to generate than weekly plans.

## Database Migration

### Step 1: Run Database Migration

If you're using Drizzle migrations, create a new migration file:

```bash
npm run db:generate
npm run db:push
```

Or manually run these SQL commands:

```sql
-- Add new columns to subscriptions table (if needed)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT NOT NULL DEFAULT 'free';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create plan_usage table
CREATE TABLE IF NOT EXISTS plan_usage (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id VARCHAR REFERENCES subscriptions(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMP NOT NULL,
  billing_period_end TIMESTAMP NOT NULL,
  weekly_plans_used INTEGER DEFAULT 0 NOT NULL,
  monthly_plans_used INTEGER DEFAULT 0 NOT NULL,
  clients_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add email and name fields to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
```

### Step 2: Update Existing Subscriptions

If you have existing subscriptions, you'll need to migrate them:

```typescript
// scripts/migrate-subscriptions.ts
import { db } from "../server/db";
import { subscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";

async function migrateExistingSubscriptions() {
  // Map old plan IDs to new ones
  const migrationMap: Record<string, string> = {
    'old_starter': 'starter',      // $49 -> $29 (downgrade or grandfather)
    'old_professional': 'professional', // $129 -> $99 (downgrade or grandfather)
    'old_enterprise': 'enterprise', // $349 -> $199 (downgrade or grandfather)
  };

  const existingSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));

  for (const sub of existingSubs) {
    const newPlanId = migrationMap[sub.planId] || sub.planId;
    
    // Option 1: Grandfather pricing (keep old price)
    // Option 2: Auto-upgrade to new plan with notice
    // Option 3: Let them choose at next renewal
    
    await db
      .update(subscriptions)
      .set({ planId: newPlanId })
      .where(eq(subscriptions.id, sub.id));
  }
}
```

## API Integration

### Using Quota Checking in Meal Plan Generation

```typescript
import { checkQuota, incrementUsage, QuotaExceededError } from "../server/quota";

async function generateMealPlan(userId: string, planType: 'daily' | 'weekly' | 'monthly') {
  // Check quota before generating
  const quotaCheck = await checkQuota(userId, planType);
  
  if (!quotaCheck.allowed) {
    throw quotaCheck.error; // QuotaExceededError
  }

  // Generate the meal plan (your OpenAI integration)
  const mealPlan = await generateWithAI(planType, options);

  // Increment usage after successful generation
  await incrementUsage(userId, planType);

  return mealPlan;
}
```

### Error Handling

```typescript
try {
  const mealPlan = await generateMealPlan(userId, 'monthly');
} catch (error) {
  if (error instanceof QuotaExceededError) {
    // Handle quota exceeded
    console.error(`Quota exceeded: ${error.code}`);
    console.error(`Used: ${error.details.used}/${error.details.limit}`);
    console.error(`Resets: ${error.details.resetDate}`);
  }
}
```

## Frontend Integration

### Display Usage Dashboard

```tsx
import { UsageDashboard } from "@/components/UsageDashboard";
import { useEffect, useState } from "react";

function Dashboard() {
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    fetch('/api/mealplan/quota')
      .then(res => res.json())
      .then(setQuota);
  }, []);

  if (!quota) return <div>Loading...</div>;

  return (
    <UsageDashboard
      weeklyPlansUsed={quota.weeklyPlans.used}
      weeklyPlansLimit={quota.weeklyPlans.limit}
      monthlyPlansUsed={quota.monthlyPlans.used}
      monthlyPlansLimit={quota.monthlyPlans.limit}
      clientsUsed={quota.clients.used}
      clientsLimit={quota.clients.limit}
      resetDate={new Date(quota.resetDate)}
    />
  );
}
```

## Stripe Integration

### Update Stripe Products

You'll need to create/update products in Stripe with the new pricing:

```javascript
// scripts/update-stripe-products.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    name: 'Starter',
    metadata: {
      plan_id: 'starter',
      clients: '50',
      weekly_plans: '80',
      monthly_plans: '10',
      team_seats: '1',
    },
    prices: [
      { unit_amount: 2900, recurring: { interval: 'month' } },
      { unit_amount: 28800, recurring: { interval: 'year' } }, // $24/mo
    ],
  },
  // ... other plans
];

async function syncProducts() {
  for (const product of products) {
    // Create or update product in Stripe
    // Implementation depends on your Stripe setup
  }
}
```

## Testing Checklist

- [ ] Database schema updated with new tables
- [ ] Existing subscriptions migrated (if applicable)
- [ ] Quota checking works for weekly plans
- [ ] Quota checking works for monthly plans
- [ ] Usage increments correctly after generation
- [ ] Usage resets at billing period start
- [ ] Frontend displays usage correctly
- [ ] Error handling for quota exceeded
- [ ] Stripe products updated
- [ ] Pricing page displays new structure
- [ ] Annual pricing shows correct discount

## Rollout Strategy

1. **Phase 1**: Deploy database changes (non-breaking)
2. **Phase 2**: Deploy backend quota checking (with fallback)
3. **Phase 3**: Update pricing page
4. **Phase 4**: Migrate existing subscriptions
5. **Phase 5**: Enable quota enforcement
6. **Phase 6**: Update Stripe products

## Support

For questions or issues, refer to:
- Plan configuration: `shared/plans.ts`
- Quota logic: `server/quota.ts`
- Storage interface: `server/storage.ts`

