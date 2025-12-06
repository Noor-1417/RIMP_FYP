import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, Badge } from '../components/common/LayoutElements';
import { Button, Input } from '../components/common/FormElements';
import { Navbar } from '../components/layout/Navbar';
import { paymentService } from '../services';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutForm = ({ amount, categoryId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    cardholderName: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    try {
      setIsLoading(true);

      // Create payment intent
      const intentResponse = await paymentService.createIntent({
        categoryId,
        amount,
      });

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(intentResponse.data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: formData.cardholderName,
            email: formData.email,
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await paymentService.confirmPayment({
          paymentIntentId: result.paymentIntent.id,
        });

        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Cardholder Name"
        name="cardholderName"
        placeholder="Full name"
        value={formData.cardholderName}
        onChange={handleChange}
        required
      />

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="your@email.com"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-primary mb-2">Card Details</label>
        <div className="p-4 border-2 border-light rounded-lg focus-within:border-primary">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#0A3D62',
                  '::placeholder': {
                    color: '#95A5A6',
                  },
                },
                invalid: {
                  color: '#E74C3C',
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={!stripe}
      >
        Pay ${amount.toFixed(2)}
      </Button>
    </form>
  );
};

export const PaymentPage = ({ categoryId, categoryName, amount, onSuccess }) => {
  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Complete Your Payment</h2>

              <div className="bg-light p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">{categoryName}</span>
                  <Badge variant="primary">${amount.toFixed(2)}</Badge>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">${amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Elements stripe={stripePromise}>
                <CheckoutForm
                  amount={amount}
                  categoryId={categoryId}
                  onSuccess={onSuccess}
                />
              </Elements>

              <p className="text-xs text-gray-500 text-center mt-6">
                Your payment is secure and encrypted. We use industry-standard SSL technology.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
