import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key. Payment features will not work.');
}

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePublishableKey) {
    return Promise.resolve(null);
  }
  
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  
  return stripePromise;
};

// Payment intent creation (typically done server-side)
export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  // This should be called from your backend API
  // For now, this is a placeholder for the client-side call
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }
  
  return await response.json();
};

