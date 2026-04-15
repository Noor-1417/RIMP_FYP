import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, Badge } from '../components/common/LayoutElements';
import { Button, Input } from '../components/common/FormElements';
import { Navbar } from '../components/layout/Navbar';
import { categoryService, paymentService } from '../services';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

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

    if (!stripe || !elements) {
      toast.error('Stripe is still loading. Please wait.');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount.');
      return;
    }

    try {
      setIsLoading(true);

      const intentResponse = await paymentService.createIntent({
        categoryId,
        amount,
      });

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
        toast.error(result.error.message || 'Payment authorization failed');
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await paymentService.confirmPayment({ paymentIntentId: result.paymentIntent.id });
        toast.success('Payment successful!');
        onSuccess();
      } else {
        toast.error('Payment could not be completed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
        Pay ${amount.toFixed(2)}
      </Button>
    </form>
  );
};

export const PaymentPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true);
      setError('');

      if (!categoryId) {
        setError('Invalid payment category.');
        setLoading(false);
        return;
      }

      try {
        const response = await categoryService.getById(categoryId);
        setCategory(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load category details.');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [categoryId]);

  const amount = Number(category?.price || 0);
  const categoryName = category?.name || 'Internship Package';

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center px-4 py-8">
        <div className="rounded-2xl bg-white p-8 shadow-lg text-center w-full max-w-md">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center px-4 py-8">
        <div className="rounded-2xl bg-white p-8 shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-4">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="secondary" fullWidth onClick={() => navigate('/categories')}>
            Back to internships
          </Button>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center px-4 py-8">
        <div className="rounded-2xl bg-white p-8 shadow-lg w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Category not found</h2>
          <p className="text-gray-600 mb-6">The selected internship package could not be found.</p>
          <Button variant="secondary" fullWidth onClick={() => navigate('/categories')}>
            Browse internships
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-primary mb-2">Complete Your Payment</h2>
                  <p className="text-gray-600">Pay securely to enroll in this internship package.</p>
                </div>

                <div className="bg-light p-6 rounded-xl border border-gray-200">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{categoryName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{category.description || 'Secure payment for your internship enrollment.'}</p>
                    </div>
                    <Badge variant="primary">${amount.toFixed(2)}</Badge>
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-4">
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
                    onSuccess={() => navigate('/intern-dashboard')}
                  />
                </Elements>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your payment is secure and encrypted. We use industry-standard SSL technology.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
