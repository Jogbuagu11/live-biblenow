import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { ReactNode, useEffect, useState } from 'react';

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider = ({ children }: StripeProviderProps) => {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  if (!stripe) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripe}>
      {children}
    </Elements>
  );
};

