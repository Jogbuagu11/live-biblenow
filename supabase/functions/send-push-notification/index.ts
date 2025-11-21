// Supabase Edge Function: Send Push Notification
// This function sends push notifications via Firebase Cloud Messaging
// It should be called when notifications are created in the database

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIREBASE_SERVER_KEY = Deno.env.get("FIREBASE_SERVER_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface NotificationPayload {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload: NotificationPayload = await req.json();

    if (!FIREBASE_SERVER_KEY) {
      throw new Error("FIREBASE_SERVER_KEY is not set");
    }

    // Get user's device tokens from Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: tokens, error: tokensError } = await supabase.rpc(
      "get_user_device_tokens",
      { p_user_id: payload.user_id }
    );

    if (tokensError) {
      throw new Error(`Failed to get device tokens: ${tokensError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No device tokens found for user" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send push notification to each device
    const results = await Promise.allSettled(
      tokens.map(async (tokenData: { token: string; platform: string }) => {
        const fcmPayload = {
          to: tokenData.token,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: "/2.png", // Your app icon
            click_action: payload.type === "message" 
              ? `${Deno.env.get("APP_URL")}/events/${payload.data?.event_id}`
              : payload.type === "wave" || payload.type === "proxy_request"
              ? `${Deno.env.get("APP_URL")}/request-feed`
              : `${Deno.env.get("APP_URL")}/notifications`,
          },
          data: {
            ...(payload.data || {}),
            notification_id: payload.notification_id,
            type: payload.type,
            event_id: payload.data?.event_id,
          },
          priority: "high",
        };

        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${FIREBASE_SERVER_KEY}`,
          },
          body: JSON.stringify(fcmPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`FCM error: ${errorText}`);
        }

        return await response.json();
      })
    );

    // Count successful sends
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({
        message: "Notifications sent",
        successful,
        failed,
        total: tokens.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

