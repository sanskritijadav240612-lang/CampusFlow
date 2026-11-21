import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, Mail, Hash, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const registerValidationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid university email address'),
    enrollmentNumber: z
      .string()
      .trim()
      .min(1, 'Enrollment number is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const StudentRegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerValidationSchema),
    defaultValues: {
      name: '',
      email: '',
      enrollmentNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await registerStudent({
        name: values.name,
        email: values.email,
        enrollmentNumber: values.enrollmentNumber,
        password: values.password,
      });

      setRegisteredEmail(values.email);
      setRegistrationSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Registration failed. Please check your connection and details.';
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
              Student Registration
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create Student Account
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Join CampusFlow to coordinate student club events and reserve campus facilities.
            </p>
          </div>

          {serverError && (
            <Alert
              variant="error"
              title="Registration Error"
              className="mb-5"
              onClose={() => setServerError(null)}
            >
              {serverError}
            </Alert>
          )}

          {registrationSuccess ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Account Created Successfully
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Your student record for <strong className="text-slate-800">{registeredEmail}</strong> has been registered. You can now sign in to your dashboard.
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                rightIcon={ArrowRight}
                onClick={() => navigate('/login')}
              >
                Proceed to Student Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                placeholder="e.g. Maya Chen"
                required
                leftIcon={User}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="College Email"
                type="email"
                placeholder="student@university.edu"
                required
                leftIcon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Enrollment / Roll Number"
                placeholder="e.g. STU-2026-8841"
                required
                leftIcon={Hash}
                error={errors.enrollmentNumber?.message}
                {...register('enrollmentNumber')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
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

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  required
                  leftIcon={Lock}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                Complete Registration
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-surface-border text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-campus-700 font-semibold hover:underline">
              Sign In to Student Portal
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

export default StudentRegisterPage;
