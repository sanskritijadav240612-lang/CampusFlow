import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Mail, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const facultyCredentialsSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or Faculty ID is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

const facultyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

export const FacultyLoginPage = () => {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [pendingIdentifier, setPendingIdentifier] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Resend cooldown timer in seconds
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { loginFaculty, verifyFacultyOtp, resendFacultyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Step 1 Form: Credentials
  const credentialsForm = useForm({
    resolver: zodResolver(facultyCredentialsSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // Step 2 Form: 6-digit OTP
  const otpForm = useForm({
    resolver: zodResolver(facultyOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Countdown timer effect
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  // Step 1: Submit Credentials -> Request OTP
  const onCredentialsSubmit = async (values) => {
    setServerError(null);
    setSuccessInfo(null);
    try {
      const response = await loginFaculty({
        identifier: values.identifier,
        password: values.password,
      });

      if (response?.data?.otpRequired) {
        setPendingIdentifier(response.data.identifier || values.identifier);
        setEmailMasked(response.data.emailMasked || 'your registered faculty email');
        setStep('otp');
        setCooldown(60); // 60s cooldown
        setSuccessInfo(`A 6-digit security code has been sent to ${response.data.emailMasked || 'your email'}.`);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Invalid credentials. Please verify your Faculty ID / Email and password.';
      setServerError(msg);
    }
  };

  // Step 2: Submit OTP -> Verify & Establish Session
  const onOtpSubmit = async (values) => {
    setServerError(null);
    try {
      await verifyFacultyOtp({
        identifier: pendingIdentifier,
        otp: values.otp,
      });

      // Redirect to intended route or default faculty overview
      const destination = location.state?.from?.pathname || '/faculty';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Invalid or expired verification code. Please check your email or request a new code.';
      setServerError(msg);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setServerError(null);
    try {
      const res = await resendFacultyOtp({ identifier: pendingIdentifier });
      setSuccessInfo(res?.message || 'New verification code sent to your email.');
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification code. Please try again later.';
      setServerError(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Reset to credentials step
  const handleBackToCredentials = () => {
    setStep('credentials');
    setServerError(null);
    setSuccessInfo(null);
    otpForm.reset();
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
              {step === 'credentials' ? 'Institutional Sign In' : 'Institutional Verification'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {step === 'credentials'
                ? 'Sign in to manage event approval workflows, inventory, and conflict detection.'
                : `Enter the 6-digit one-time code sent to ${emailMasked}.`}
            </p>
          </div>

          {step === 'credentials' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 mb-5 leading-relaxed">
              <strong>Security Notice:</strong> Faculty accounts are provisioned exclusively by university administration. Two-factor email verification is enforced on every institutional sign in.
            </div>
          )}

          {serverError && (
            <Alert
              variant="error"
              title="Authentication Notice"
              className="mb-5"
              onClose={() => setServerError(null)}
            >
              {serverError}
            </Alert>
          )}

          {successInfo && (
            <Alert
              variant="success"
              title="Verification Code Sent"
              className="mb-5"
              onClose={() => setSuccessInfo(null)}
            >
              {successInfo}
            </Alert>
          )}

          {step === 'credentials' ? (
            /* STEP 1: CREDENTIALS FORM */
            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-4" noValidate>
              <Input
                label="College Email or Faculty ID"
                placeholder="e.g. FAC-001 or faculty@university.edu"
                required
                leftIcon={Shield}
                error={credentialsForm.formState.errors.identifier?.message}
                {...credentialsForm.register('identifier')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter administrative password"
                  required
                  leftIcon={Lock}
                  error={credentialsForm.formState.errors.password?.message}
                  {...credentialsForm.register('password')}
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
                isLoading={credentialsForm.formState.isSubmitting}
              >
                Continue with 2FA
              </Button>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT OTP FORM */
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5" noValidate>
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-md p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  A verification code has been dispatched to{' '}
                  <span className="font-semibold text-slate-900">{emailMasked}</span>.
                  The code is valid for <strong>5 minutes</strong>.
                </div>
              </div>

              <div>
                <Input
                  label="6-Digit Security Code"
                  placeholder="123456"
                  required
                  autoFocus
                  maxLength={6}
                  leftIcon={KeyRound}
                  className="text-center font-mono text-xl tracking-[0.35em] font-bold"
                  error={otpForm.formState.errors.otp?.message}
                  {...otpForm.register('otp', {
                    onChange: (e) => {
                      // Filter non-digits automatically
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    },
                  })}
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                rightIcon={ArrowRight}
                isLoading={otpForm.formState.isSubmitting}
              >
                Verify & Access Portal
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isResending}
                  className={`inline-flex items-center gap-1 font-medium transition-colors focus:outline-none ${
                    cooldown > 0 || isResending
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-primary-600 hover:text-primary-700 underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

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
