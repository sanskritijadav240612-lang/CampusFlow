import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const facultyLoginValidationSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or Faculty ID is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const FacultyLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  const { loginFaculty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(facultyLoginValidationSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await loginFaculty({
        identifier: values.identifier,
        password: values.password,
      });

      // Redirect to intended route or default faculty overview
      const destination = location.state?.from?.pathname || '/faculty';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Invalid credentials. Please verify your Faculty ID / Email and password.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-base">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg border border-surface-border shadow-soft p-8">
          <div className="mb-6 text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white mb-2">
              Faculty & Administration
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Institutional Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign in to manage event approval workflows, inventory, and conflict detection.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 mb-5 leading-relaxed">
            <strong>Security Notice:</strong> Faculty accounts are provisioned exclusively by university administration. There is no public registration for administrative credentials.
          </div>

          {serverError && (
            <Alert
              variant="error"
              title="Access Denied"
              className="mb-5"
              onClose={() => setServerError(null)}
            >
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="College Email or Faculty ID"
              placeholder="e.g. FAC-001 or faculty@university.edu"
              required
              leftIcon={Shield}
              error={errors.identifier?.message}
              {...register('identifier')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter administrative password"
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
              variant="secondary"
              className="w-full mt-2"
              rightIcon={ArrowRight}
              isLoading={isSubmitting}
            >
              Authenticate Faculty Access
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-border text-center text-xs">
            <Link
              to="/login"
              className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
            >
              &larr; Switch to Student Sign In
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-700 hover:underline">
            Return to CampusFlow Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FacultyLoginPage;
