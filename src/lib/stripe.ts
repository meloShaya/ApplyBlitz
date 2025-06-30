import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripePromise = loadStripe(stripePublishableKey);

export const SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Standard',
    price: 99,
    applications: 50,
    features: [
      '50 applications per month',
      'AI job matching',
      'Basic dashboard',
      'Email notifications'
    ],
    stripePriceId: 'price_standard_monthly'
  },
  pro: {
    name: 'Pro',
    price: 199,
    applications: 200,
    features: [
      '200 applications per month',
      'Advanced AI matching',
      'Priority application queue',
      'Detailed analytics',
      'Premium support'
    ],
    stripePriceId: 'price_pro_monthly'
  }
};