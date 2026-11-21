import { z } from 'zod';

export const registerStudentSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    enrollmentNumber: z
      .string({ required_error: 'Enrollment number is required' })
      .trim()
      .min(1, 'Enrollment number is required'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  })
  .strict({
    message: 'Unexpected field in registration payload',
  });

export const loginStudentSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  })
  .strict({
    message: 'Unexpected field in student login payload',
  });

export const loginFacultySchema = z
  .object({
    identifier: z
      .string({ required_error: 'Email or Faculty ID is required' })
      .trim()
      .min(1, 'Email or Faculty ID is required'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  })
  .strict({
    message: 'Unexpected field in faculty login payload',
  });

export const verifyFacultyOtpSchema = z
  .object({
    identifier: z
      .string({ required_error: 'Email or Faculty ID is required' })
      .trim()
      .min(1, 'Email or Faculty ID is required'),
    otp: z
      .string({ required_error: 'Verification code is required' })
      .trim()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Verification code must contain digits only'),
  })
  .strict({
    message: 'Unexpected field in OTP verification payload',
  });

export const resendFacultyOtpSchema = z
  .object({
    identifier: z
      .string({ required_error: 'Email or Faculty ID is required' })
      .trim()
      .min(1, 'Email or Faculty ID is required'),
  })
  .strict({
    message: 'Unexpected field in OTP resend payload',
  });
