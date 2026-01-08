# n8n Webhook Integration Guide

## Setup Instructions

### 1. Create n8n Webhook

In your n8n instance, create a new workflow with a **Webhook** trigger node:

1. Add a **Webhook** node as the first node
2. Set the HTTP Method to `POST`
3. Set the Path to something like `/webhook/assessment`
4. Copy the Production URL (it will look like: `https://your-n8n-instance.com/webhook/assessment`)

### 2. Configure Environment Variable

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Add your n8n webhook URL:

```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/assessment
```

### 3. Payload Structure

The assessment will POST the following JSON to your webhook:

```json
{
  "email": "user@example.com",
  "painPoints": "User's pain points text (optional)",
  "answers": {
    "q1-engagement": "ai",
    "q2-response-time": "60s",
    "q3-availability": "yes",
    "q4-show-rate": "90-plus",
    "q5-ghost-rate": "sub-5",
    "q6-conversion": "90-100",
    "q7-primary-role": "90-100",
    "q8-follow-up-time": "none",
    "q9-repetitive-tasks": "1h",
    "q10-kpi-tracking": "perfect",
    "q11-documents": "fully-automated"
  },
  "timestamp": "2026-01-08T12:34:56.789Z"
}
```

### 4. n8n Workflow Example

After the Webhook node, you might want to add:

1. **Set node** - Transform/parse the data
2. **Function node** - Calculate scores or generate insights
3. **Email node** - Send results to the user
4. **Database node** - Store the submission
5. **Slack/Discord node** - Notify your team

### 5. Testing

1. Start your development server: `npm run dev`
2. Complete the assessment at `http://localhost:3000`
3. Check your n8n workflow executions

### 6. Deployment (Vercel)

When deploying to Vercel:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `NEXT_PUBLIC_N8N_WEBHOOK_URL` with your production webhook URL
4. Redeploy your application

## Question IDs Reference

| Question ID | Pillar | Description |
|------------|--------|-------------|
| q1-engagement | customer | Client engagement method |
| q2-response-time | customer | Response time to enquiries |
| q3-availability | customer | 24/7 availability |
| q4-show-rate | customer | Appointment show-up rate |
| q5-ghost-rate | customer | Client ghosting percentage |
| q6-conversion | revenue | Transaction conversion rate |
| q7-primary-role | operations | Team time on primary role |
| q8-follow-up-time | operations | Lead follow-up time |
| q9-repetitive-tasks | operations | Time on repetitive tasks |
| q10-kpi-tracking | data | KPI tracking quality |
| q11-documents | operations | Document/signature handling |

## Scoring Ideas

You can implement scoring in n8n based on answer IDs. For example:

- **Better answers** (more automated): Higher scores
- **Worse answers** (more manual): Lower scores
- Calculate pillar scores by averaging question scores within each pillar
- Generate recommendations based on weak areas
