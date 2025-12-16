# OpenAI Integration Setup

## ✅ Completed

1. ✅ Installed `openai` package
2. ✅ Created `server/services/openai.ts` with meal plan generation
3. ✅ Updated `POST /api/mealplan/generate` to use OpenAI
4. ✅ Added error handling and token usage logging

## 📋 Required Steps

### 1. Add OpenAI API Key to `.env.local`

Add this line to your `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

**Note**: The `.env.local` file is already in `.gitignore` and will not be committed to git.

### 2. Restart Dev Server

After adding the API key, restart your dev server:

```bash
npm run dev
```

## 🔧 How It Works

### API Endpoint

**POST `/api/mealplan/generate`**

**Request Body**:
```json
{
  "planType": "daily" | "weekly" | "monthly",
  "userProfile": {
    "gender": "female" | "male" | "other",
    "age": 25,
    "height": 170,
    "currentWeight": 70,
    "targetWeight": 65,
    "goal": "lose_weight" | "build_muscle" | "maintain" | "health",
    "activity": "sedentary" | "light" | "moderate" | "active" | "athlete",
    "diet": ["Vegetarian", "Keto"],
    "religious": "none" | "halal" | "kosher" | "jain" | "hindu" | "buddhist",
    "conditions": ["Type 2 Diabetes", "High Blood Pressure"],
    "allergies": ["Peanuts", "Dairy"]
  },
  "options": {
    "calories": 2000,
    "duration": 7
  }
}
```

**Response**:
```json
{
  "success": true,
  "mealPlan": {
    "id": "plan_1234567890",
    "type": "weekly",
    "duration": 7,
    "overview": {
      "dailyCalories": 2000,
      "macros": {
        "protein": 150,
        "carbs": 200,
        "fat": 67
      },
      "duration": 7,
      "type": "weekly"
    },
    "days": [
      {
        "day": 1,
        "meals": {
          "breakfast": {
            "name": "Greek Yogurt Parfait",
            "ingredients": ["1 cup Greek yogurt", "1/2 cup berries"],
            "instructions": "Layer yogurt with berries.",
            "nutrition": {
              "calories": 350,
              "protein": 20,
              "carbs": 45,
              "fat": 8
            }
          },
          "lunch": { ... },
          "dinner": { ... },
          "snacks": [ ... ]
        }
      }
    ],
    "groceryList": {
      "produce": ["Berries", "Spinach"],
      "protein": ["Chicken breast", "Greek yogurt"],
      "dairy": ["Milk"],
      "pantry": ["Olive oil", "Rice"]
    },
    "generatedAt": "2024-12-06T12:00:00.000Z",
    "tokenUsage": {
      "promptTokens": 1500,
      "completionTokens": 3000,
      "totalTokens": 4500
    }
  },
  "quota": {
    "weeklyPlans": { "used": 5, "limit": 50 },
    "monthlyPlans": { "used": 0, "limit": 0 },
    "clients": { "used": 1, "limit": 1 },
    "resetDate": "2024-12-31T00:00:00.000Z"
  },
  "tokenUsage": {
    "promptTokens": 1500,
    "completionTokens": 3000,
    "totalTokens": 4500
  }
}
```

### Features

1. **Quota Checking**: Checks quota BEFORE calling OpenAI to avoid unnecessary costs
2. **User Profile**: Accepts user profile in request or fetches from database
3. **Calorie Calculation**: Automatically calculates daily calories using Mifflin-St Jeor equation
4. **Error Handling**: Graceful handling of rate limits, API errors, and invalid responses
5. **Token Logging**: Logs token usage and estimated costs for monitoring
6. **JSON Validation**: Validates and parses OpenAI response, handles markdown code blocks

### Cost Monitoring

The service logs token usage and estimated costs:
- **Input tokens**: $0.15 per 1M tokens
- **Output tokens**: $0.60 per 1M tokens
- **Estimated cost per plan**: ~$0.01-0.02 for weekly, ~$0.10-0.20 for monthly

Example log output:
```
[12:00:00] [openai] Token usage - Prompt: 1500, Completion: 3000, Total: 4500
[12:00:00] [openai] Estimated cost: $0.0019
```

## 🧪 Testing

### Test Meal Plan Generation

1. **Start dev server**: `npm run dev`
2. **Sign in** to your account
3. **Make API request**:

```bash
curl -X POST http://localhost:3000/api/mealplan/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "planType": "weekly",
    "userProfile": {
      "gender": "female",
      "age": 30,
      "height": 165,
      "currentWeight": 70,
      "targetWeight": 65,
      "goal": "lose_weight",
      "activity": "moderate",
      "diet": ["Vegetarian"],
      "religious": "none",
      "conditions": [],
      "allergies": ["Peanuts"]
    }
  }'
```

### Expected Behavior

1. ✅ Quota is checked first
2. ✅ OpenAI API is called with detailed prompt
3. ✅ Meal plan is generated and validated
4. ✅ Plan is saved to `meal_plans` table
5. ✅ Usage counter is incremented
6. ✅ Response includes plan, quota, and token usage

## 🐛 Troubleshooting

### "OPENAI_API_KEY is not configured"
- Make sure `.env.local` exists with `OPENAI_API_KEY=sk-...`
- Restart dev server after adding the key
- Check that the key is valid in OpenAI dashboard

### "OpenAI rate limit exceeded"
- You've hit OpenAI's rate limit
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan for higher limits

### "Failed to parse JSON response"
- OpenAI sometimes returns markdown code blocks
- The service tries to extract JSON automatically
- If it fails, the error will be logged
- Try generating again - OpenAI responses can vary

### "User profile data is required"
- Provide `userProfile` in the request body
- Or create a `user_profiles` table in Supabase to store profile data
- Complete the onboarding questionnaire to save profile data

## 📊 Token Usage & Costs

### Typical Token Usage

- **Weekly Plan (7 days)**: ~2,000-4,000 tokens
- **Monthly Plan (30 days)**: ~8,000-12,000 tokens

### Cost Estimates

- **Weekly Plan**: ~$0.01-0.02
- **Monthly Plan**: ~$0.10-0.20

### Monitoring

Token usage is logged to console and included in API response. You can:
- Monitor costs in OpenAI dashboard
- Track usage in your application logs
- Store `tokenUsage` in database for analytics

## 🔐 Security Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Keep OpenAI API key secure
- Consider using environment-specific keys for production
- Monitor API usage to detect abuse

## 📚 Next Steps

1. **Create user_profiles table** to store onboarding data
2. **Add profile update endpoint** to update user preferences
3. **Implement caching** for frequently requested plans
4. **Add plan regeneration** with variations
5. **Create admin dashboard** for cost monitoring

