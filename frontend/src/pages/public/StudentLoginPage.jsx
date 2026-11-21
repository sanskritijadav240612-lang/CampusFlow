import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const loginValidationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid university email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const StudentLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  const { loginStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await loginStudent({
        email: values.email,
        password: values.password,
      });

      // Redirect to intended route or default student overview
      const destination = location.state?.from?.pathname || '/student';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Invalid email or password. Please verify your credentials.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-base">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg border border-surface-border shadow-soft p-8">
          <div className="mb-6 text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-campus-50 text-campus-700 border border-campus-200 mb-2">
              Student Access
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your college credentials to manage event drafts and view bookings.
            </p>
          </div>

          {serverError && (
            <Alert
              variant="error"
              title="Authentication Failed"
              className="mb-5"
              onClose={() => setServerError(null)}
            >
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="College Email"
              type="email"
              placeholder="student@university.edu"
              required
              leftIcon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                leftIcon={Lock}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              rightIcon={ArrowRight}
              isLoading={isSubmitting}
            >
              Sign In to Student Portal
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-border flex items-center justify-between text-xs">
            <span className="text-slate-500">Need an account?</span>
            <Link to="/register" className="text-campus-700 font-semibold hover:underline">
              Register as Student
            </Link>
          </div>

          <div className="mt-3 pt-3 border-t border-surface-border text-center text-xs">
            <Link
              to="/faculty/login"
              className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
            >
              Faculty / Administrator Login &rarr;
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-700 hover:underline">
            &larr; Back to CampusFlow Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
