import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

const BCRYPT_SALT_ROUNDS = 12;

const seedSchema = z.object({
  FACULTY_NAME: z
    .string({ required_error: 'FACULTY_NAME environment variable is required' })
    .trim()
    .min(2, 'FACULTY_NAME must be at least 2 characters'),
  FACULTY_EMAIL: z
    .string({ required_error: 'FACULTY_EMAIL environment variable is required' })
    .trim()
    .toLowerCase()
    .email('FACULTY_EMAIL must be a valid email address'),
  FACULTY_ID: z
    .string({ required_error: 'FACULTY_ID environment variable is required' })
    .trim()
    .min(1, 'FACULTY_ID is required'),
  FACULTY_INITIAL_PASSWORD: z
    .string({ required_error: 'FACULTY_INITIAL_PASSWORD environment variable is required' })
    .min(8, 'FACULTY_INITIAL_PASSWORD must be at least 8 characters long'),
});

const seedFaculty = async () => {
  const parsed = seedSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Faculty seed configuration error:');
    parsed.error.issues.forEach((issue) => {
      console.error(`- ${issue.message}`);
    });
    process.exit(1);
  }

  const { FACULTY_NAME, FACULTY_EMAIL, FACULTY_ID, FACULTY_INITIAL_PASSWORD } = parsed.data;

  try {
    await connectDB();

    const normalizedEmail = FACULTY_EMAIL.toLowerCase().trim();
    const normalizedFacultyId = FACULTY_ID.trim();

    // Check for conflicting student identity with this email
    const studentConflict = await User.findOne({
      email: normalizedEmail,
      role: 'student',
    });
    if (studentConflict) {
      console.error(`Conflict: A student account already exists with email: ${normalizedEmail}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Check if faculty account already exists by email or facultyId
    const existingFaculty = await User.findOne({
      role: 'faculty',
      $or: [{ email: normalizedEmail }, { facultyId: normalizedFacultyId }],
    });

    if (existingFaculty) {
      console.log(`Faculty account already exists for ${normalizedEmail} (${normalizedFacultyId}). No action taken.`);
      await mongoose.disconnect();
      return;
    }

    // Hash password with 12 salt rounds
    const passwordHash = await bcrypt.hash(FACULTY_INITIAL_PASSWORD, BCRYPT_SALT_ROUNDS);

    const newFaculty = await User.create({
      name: FACULTY_NAME.trim(),
      email: normalizedEmail,
      facultyId: normalizedFacultyId,
      passwordHash,
      role: 'faculty',
      isActive: true,
    });

    console.log(`Successfully created faculty account: ${newFaculty.name} [ID: ${newFaculty.facultyId}] <${newFaculty.email}>`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Failed to seed faculty account:', error.message || error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

seedFaculty();
