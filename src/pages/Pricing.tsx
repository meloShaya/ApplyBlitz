import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Star, Crown } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { SUBSCRIPTION_PLANS } from '../lib/stripe';
import { LocalMemory, localMemoryStore } from '../lib/localMemory';
import { useAuth } from '../contexts/AuthContext';

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      if (LocalMemory) {
        // Simulate Stripe checkout and payment success
        const checkoutUrl = await localMemoryStore.createCheckoutSession('price_' + planName.toLowerCase());
        
        // Simulate user going through checkout and returning
        setTimeout(async () => {
          await localMemoryStore.simulatePaymentSuccess(user.id, planName);
          alert(`🎉 Demo: Successfully subscribed to ${planName} plan! Redirecting to dashboard...`);
          navigate('/dashboard');
        }, 2000);
        
        alert(`🎭 Demo: Redirecting to Stripe checkout for ${planName} plan...`);
      } else {
        // Real Stripe integration
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceId: SUBSCRIPTION_PLANS[planName.toLowerCase() as keyof typeof SUBSCRIPTION_PLANS].stripePriceId }),
        });

        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Simple, Transparent Pricing</span>
            {LocalMemory && <span>🎭 Demo Mode</span>}
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Start your automated job search today. Cancel anytime, no hidden fees.
          </p>
          {LocalMemory && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🎭 Demo Mode: All payments are simulated
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Standard Plan */}
          <Card className="relative overflow-hidden p-4 sm:p-6 lg:p-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {SUBSCRIPTION_PLANS.standard.name}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Perfect for getting started</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    ${SUBSCRIPTION_PLANS.standard.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Until you get hired
                </p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {SUBSCRIPTION_PLANS.standard.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {user ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleSubscribe('Standard')}
                >
                  Get Started with Standard
                </Button>
              ) : (
                <Link to="/auth" className="block">
                  <Button className="w-full" size="lg">
                    Get Started with Standard
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="relative overflow-hidden border-2 border-purple-500 dark:border-purple-400 p-4 sm:p-6 lg:p-8">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-blue-600 text-white px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium">
              Most Popular
            </div>
            <div className="pt-6 sm:pt-8">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg mr-3">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {SUBSCRIPTION_PLANS.pro.name}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">For serious job seekers</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    ${SUBSCRIPTION_PLANS.pro.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Until you get hired
                </p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {SUBSCRIPTION_PLANS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {user ? (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                  size="lg"
                  onClick={() => handleSubscribe('Pro')}
                >
                  Get Started with Pro
                </Button>
              ) : (
                <Link to="/auth" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" size="lg">
                    Get Started with Pro
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 sm:mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How does the "until you get hired" pricing work?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Once you receive and accept a job offer, your subscription automatically pauses. 
                You only pay while actively job searching.
              </p>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What job boards do you support?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                We support major job boards including LinkedIn, Indeed, Glassdoor, AngelList, 
                and hundreds of company career pages.
              </p>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Yes! You can cancel your subscription at any time. Your service will continue 
                until the end of your current billing period.
              </p>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What if I don't get any interviews?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                We're confident in our service. If you don't get any interview requests within 
                30 days, contact our support team for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}