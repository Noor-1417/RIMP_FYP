import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/common/FormElements';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('Login successful!');
        // Backend indicates where to redirect next
        if (result.redirectTo === 'admin-dashboard') navigate('/admin-dashboard');
        else if (result.redirectTo === 'cv-builder') navigate('/cv-builder');
        else if (result.redirectTo === 'intern-dashboard') navigate('/intern-dashboard');
        else navigate('/intern-dashboard');
      } else {
        toast.error(result.message || 'Login failed');
        console.error('Login error:', result);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Network error: Unable to reach server';
      console.error('Login error:', err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
      >
        {/* Right promotional panel */}
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary text-white p-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to RIMP</h2>
          <p className="text-sm opacity-90 mb-6 text-center">Manage remote internships, track progress, and certify successful candidates — all in one place.</p>
          <ul className="text-sm space-y-3 text-white/90 mb-6">
            <li>• Structured Internship Programs</li>
            <li>• Automated AI-assisted Grading</li>
            <li>• Digital Certificates with QR verification</li>
          </ul>
          <div className="w-full">
            <Button variant="outline" fullWidth onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>

        <div className="p-8">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Create Your Account</h1>
          <p className="text-gray-600">Start your internship journey — create an account to access courses, tasks and certificates.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <div className="flex justify-end mt-[-1rem]">
            <Link to="/forgot-password" size="sm" className="text-sm font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-secondary font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-sm text-gray-700">
            ← Back to Home
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-light">
          <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Admin:</strong> admin@rimp.com / password</p>
            <p><strong>Intern:</strong> intern@rimp.com / password</p>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
};

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'intern',
  });
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (result.success) {
        toast.success('Registration successful!');
        // Backend tells us where to send the user next
        if (result.redirectTo === 'cv-builder') navigate('/cv-builder');
        else if (result.redirectTo === 'admin-dashboard') navigate('/admin-dashboard');
        else navigate('/intern-dashboard');
      } else {
        const message = result.message || 'Registration failed';
        toast.error(message);
        console.error('Register error:', result);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Network error: Unable to reach server';
      console.error('Register error:', err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">RIMP</h1>
          <p className="text-gray-600">Create Your Account</p>
          <p className="text-sm text-gray-500 mt-2">Join as Admin or Student</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          {/* Role Selection Cards */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">Select Your Role</label>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                onClick={() => handleChange({ target: { name: 'role', value: 'admin' } })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.role === 'admin'
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-gray-200 bg-gray-50 hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <p className="text-2xl mb-2">👨‍💼</p>
                  <p className="font-semibold text-gray-900">Admin</p>
                  <p className="text-xs text-gray-600 mt-1">Manage platform</p>
                </div>
              </motion.div>

              <motion.div
                onClick={() => handleChange({ target: { name: 'role', value: 'intern' } })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.role === 'intern'
                    ? 'border-secondary bg-secondary/5 shadow-lg'
                    : 'border-gray-200 bg-gray-50 hover:border-secondary/50'
                }`}
              >
                <div className="text-center">
                  <p className="text-2xl mb-2">🎓</p>
                  <p className="font-semibold text-gray-900">Student</p>
                  <p className="text-xs text-gray-600 mt-1">Join internship</p>
                </div>
              </motion.div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-secondary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">By creating an account you agree to our <button type="button" className="text-primary font-semibold hover:underline">Terms</button> and <button type="button" className="text-primary font-semibold hover:underline">Privacy Policy</button>.</p>
        </div>
      </motion.div>
    </div>
  );
};
