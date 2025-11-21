# Send Push Notification Edge Function

This Supabase Edge Function sends push notifications via Firebase Cloud Messaging (FCM) when notifications are created in the database.

## Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy send-push-notification
   ```

2. **Set environment variables in Supabase Dashboard:**
   - Go to Project Settings → Edge Functions → Environment Variables
   - Add:
     - `FIREBASE_SERVER_KEY`: Your Firebase Cloud Messaging Server Key
     - `APP_URL`: Your app URL (e.g., `https://takemewithyou.app`)

3. **Get Firebase Server Key:**
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Copy the "Server key" (Legacy)

## Usage

This function is automatically called via database triggers when:
- A new message is created (`event_messages`)
- A new wave (event assignment) is created (`event_assignments`)
- A wave is accepted (`event_assignments` status update)

You can also call it manually:

```typescript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    notification_id: 'uuid',
    user_id: 'user-uuid',
    type: 'message',
    title: 'New message',
    body: 'You have a new message',
    data: {
      event_id: 'event-uuid',
      message_id: 'message-uuid',
    }
  }
});
```

## Database Trigger Integration

The function should be called from a database trigger. You can create a trigger that calls this function:

```sql
-- This would be added to the push_notifications migration
-- Note: Supabase doesn't directly support calling Edge Functions from triggers
-- You'll need to use pg_net or set up a webhook

-- Alternative: Use Supabase Realtime to listen for new notifications
-- and call the Edge Function from your app
```

## Alternative: Webhook Approach

Instead of calling from triggers, you can:
1. Listen to Supabase Realtime for new notifications
2. Call the Edge Function from your app when notifications are created
3. Or use a webhook service like Zapier/Make.com

