import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno&deno-std=0.208.0";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const verifiedPriceId = Deno.env.get("STRIPE_VERIFIED_PRICE_ID");
const appUrl = Deno.env.get("APP_URL") ?? "https://tmwy.app";

if (!stripeSecretKey || !verifiedPriceId) {
  console.error("Missing Stripe configuration for verified memberships.");
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!stripe || !verifiedPriceId) {
    return new Response(
      JSON.stringify({ error: "Stripe is not configured for verified memberships." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required to start verification." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: verifiedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/profile?verified=success`,
      cancel_url: `${appUrl}/profile`,
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unable to create checkout session" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});

