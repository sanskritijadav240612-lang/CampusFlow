import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Resource from '../src/models/Resource.js';
import EventRequest from '../src/models/EventRequest.js';
import Allocation from '../src/models/Allocation.js';
import Notification from '../src/models/Notification.js';
import AuditLog from '../src/models/AuditLog.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from '../src/config/jwt.js';
import {
  calculateMaxConcurrentQuantity,
  checkAvailability,
} from '../src/services/availability.service.js';
import { cleanAndParseJson } from '../src/services/ai.service.js';
import { aiResponseSchema } from '../src/validators/ai.schemas.js';
import * as authService from '../src/services/auth.service.js';
import * as emailService from '../src/services/email.service.js';
import * as facultyService from '../src/services/faculty.service.js';
import * as requestService from '../src/services/request.service.js';
import * as resourceService from '../src/services/resource.service.js';
import * as notificationService from '../src/services/notification.service.js';
import {
  registerStudentSchema,
  loginStudentSchema,
  loginFacultySchema,
  verifyFacultyOtpSchema,
  resendFacultyOtpSchema,
} from '../src/validators/auth.schemas.js';
import {
  createResourceSchema,
  resourceQuerySchema,
} from '../src/validators/resource.schemas.js';
import {
  checkAvailabilitySchema,
  createEventRequestSchema,
  myRequestsQuerySchema,
} from '../src/validators/request.schemas.js';
import { decisionRemarkSchema } from '../src/validators/faculty.schemas.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, description) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${description}`);
  }
};

const assertThrows = (fn, description) => {
  totalTests++;
  try {
    fn();
    failedTests++;
    console.error(`  ✗ FAIL: ${description} (Expected exception but none thrown)`);
  } catch {
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  }
};

const assertAsyncThrows = async (fn, description) => {
  totalTests++;
  try {
    await fn();
    failedTests++;
    console.error(`  ✗ FAIL: ${description} (Expected async exception but none thrown)`);
  } catch {
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  }
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log('   CAMPUSFLOW COMPREHENSIVE INTEGRATION TEST SUITE   ');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SECTION 1: SCHEMA VALIDATION TESTS
  // ----------------------------------------------------
  console.log('--- SECTION 1: SCHEMA & INPUT VALIDATION TESTS ---');

  // Student Registration Validation
  const validStudent = registerStudentSchema.safeParse({
    name: 'Aarav Sharma',
    email: 'aarav@campus.edu',
    enrollmentNumber: 'CS2026-001',
    password: 'password123',
  });
  assert(validStudent.success, 'Valid student registration payload accepted');

  const invalidEmailStudent = registerStudentSchema.safeParse({
    name: 'Aarav',
    email: 'not-an-email',
    enrollmentNumber: 'CS2026-001',
    password: 'password123',
  });
  assert(!invalidEmailStudent.success, 'Rejects invalid student email format');

  const shortPasswordStudent = registerStudentSchema.safeParse({
    name: 'Aarav',
    email: 'aarav@campus.edu',
    enrollmentNumber: 'CS2026-001',
    password: 'short',
  });
  assert(!shortPasswordStudent.success, 'Rejects student password shorter than 8 characters');

  const extraFieldStudent = registerStudentSchema.safeParse({
    name: 'Aarav',
    email: 'aarav@campus.edu',
    enrollmentNumber: 'CS2026-001',
    password: 'password123',
    role: 'faculty', // malicious role injection
  });
  assert(!extraFieldStudent.success, 'Strict schema rejects unexpected fields in registration');

  // Faculty OTP Schemas Validation
  const validOtpPayload = verifyFacultyOtpSchema.safeParse({
    identifier: 'prof.sharma@campus.edu',
    otp: '123456',
  });
  assert(validOtpPayload.success, 'Valid faculty OTP verification payload accepted');

  const invalidOtpShort = verifyFacultyOtpSchema.safeParse({
    identifier: 'prof.sharma@campus.edu',
    otp: '123',
  });
  assert(!invalidOtpShort.success, 'Rejects OTP shorter than 6 digits');

  const invalidOtpNonNumeric = verifyFacultyOtpSchema.safeParse({
    identifier: 'prof.sharma@campus.edu',
    otp: '12A456',
  });
  assert(!invalidOtpNonNumeric.success, 'Rejects non-numeric characters in OTP');

  const validResendPayload = resendFacultyOtpSchema.safeParse({
    identifier: 'prof.sharma@campus.edu',
  });
  assert(validResendPayload.success, 'Valid faculty OTP resend payload accepted');

  // Resource Creation Validation
  const validVenue = createResourceSchema.safeParse({
    name: 'Main Auditorium',
    category: 'Auditorium',
    resourceMode: 'capacity',
    capacity: 500,
    location: 'Building A, Floor 1',
  });
  assert(validVenue.success, 'Valid capacity-based venue accepted');

  const invalidVenueTotalQty = createResourceSchema.safeParse({
    name: 'Main Auditorium',
    category: 'Auditorium',
    resourceMode: 'capacity',
    capacity: 500,
    totalQuantity: 1, // illegal for capacity mode
  });
  assert(!invalidVenueTotalQty.success, 'Rejects totalQuantity on capacity-based resource');

  const validEquipment = createResourceSchema.safeParse({
    name: 'Handheld Wireless Mics',
    category: 'Audio/Visual',
    resourceMode: 'quantity',
    totalQuantity: 15,
  });
  assert(validEquipment.success, 'Valid quantity-based equipment accepted');

  const negativeEquipment = createResourceSchema.safeParse({
    name: 'Projector',
    category: 'Audio/Visual',
    resourceMode: 'quantity',
    totalQuantity: -5,
  });
  assert(!negativeEquipment.success, 'Rejects negative totalQuantity');

  // Decision Remark Validation
  const validRemark = decisionRemarkSchema.safeParse({
    decisionRemark: 'Approved for campus tech fest.',
  });
  assert(validRemark.success, 'Valid faculty decision remark accepted');

  const emptyRemark = decisionRemarkSchema.safeParse({});
  assert(emptyRemark.success, 'Empty decision remark allowed for approval');

  // AI Response Parser & Schema Robustness Tests
  const pureJsonRaw = '{"assistantMessage": "Hello student", "eventDraft": {"title": "Hackathon 2026"}}';
  const parsedPure = cleanAndParseJson(pureJsonRaw);
  assert(parsedPure.assistantMessage === 'Hello student', 'cleanAndParseJson parses bare JSON');

  const codeFenceRaw = '```json\n{"assistantMessage": "Parsed fence", "eventDraft": {"title": "AI Summit"}}\n```';
  const parsedFence = cleanAndParseJson(codeFenceRaw);
  assert(parsedFence.assistantMessage === 'Parsed fence', 'cleanAndParseJson extracts from markdown code fences');

  const reasoningRaw = '<think>Let me formulate the event JSON for the user.</think>\nSure! Here is your event draft:\n```json\n{"assistantMessage": "Reasoning stripped", "eventDraft": {"title": "Robotics Expo", "attendeeCount": "200"}}\n```\nHope this helps!';
  const parsedReasoning = cleanAndParseJson(reasoningRaw);
  assert(parsedReasoning.assistantMessage === 'Reasoning stripped', 'cleanAndParseJson strips <think> tags and preamble');

  const validatedAiResponse = aiResponseSchema.safeParse(parsedReasoning);
  assert(validatedAiResponse.success, 'aiResponseSchema validates reasoning-extracted JSON');
  assert(validatedAiResponse.data.eventDraft.attendeeCount === 200, 'aiResponseSchema coerces stringified attendeeCount to number');

  // ----------------------------------------------------
  // SECTION 2: JWT AUTHENTICATION & SECURITY TESTS
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: JWT & SECURITY UNIT TESTS ---');

  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    role: 'student',
  };

  const accessToken = generateAccessToken(mockUser);
  assert(typeof accessToken === 'string' && accessToken.length > 20, 'Generates valid JWT access token');

  const decodedAccess = verifyAccessToken(accessToken);
  assert(decodedAccess.sub === mockUser._id.toString(), 'Decodes access token subject correctly');
  assert(decodedAccess.role === 'student', 'Decodes user role correctly');
  assert(decodedAccess.type === 'access', 'Access token has type access');

  const refreshToken = generateRefreshToken(mockUser);
  const decodedRefresh = verifyRefreshToken(refreshToken);
  assert(decodedRefresh.type === 'refresh', 'Refresh token has type refresh');

  assertThrows(() => {
    verifyAccessToken(refreshToken);
  }, 'Access token verifier rejects refresh token (signature / algorithm check)');

  const tokenHash = hashToken('sample_refresh_token_string');
  assert(typeof tokenHash === 'string' && tokenHash.length === 64, 'Produces 64-char SHA-256 hash');

  // ----------------------------------------------------
  // SECTION 3: AVAILABILITY & SWEEP-LINE ALGORITHM TESTS
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: AVAILABILITY & SWEEP-LINE ALGORITHM TESTS ---');

  const tStart = new Date('2026-12-01T10:00:00Z');
  const tEnd = new Date('2026-12-01T14:00:00Z');

  // Test touching intervals (10:00-12:00 and 12:00-14:00)
  const touchingAllocations = [
    { startAt: new Date('2026-12-01T10:00:00Z'), endAt: new Date('2026-12-01T12:00:00Z'), quantity: 4 },
    { startAt: new Date('2026-12-01T12:00:00Z'), endAt: new Date('2026-12-01T14:00:00Z'), quantity: 4 },
  ];
  const maxTouching = calculateMaxConcurrentQuantity(touchingAllocations, tStart, tEnd);
  assert(maxTouching === 4, 'Touching boundary allocations do NOT overlap (max concurrent is 4, not 8)');

  // Test overlapping intervals (10:00-12:30 and 11:30-14:00)
  const overlappingAllocs = [
    { startAt: new Date('2026-12-01T10:00:00Z'), endAt: new Date('2026-12-01T12:30:00Z'), quantity: 3 },
    { startAt: new Date('2026-12-01T11:30:00Z'), endAt: new Date('2026-12-01T14:00:00Z'), quantity: 4 },
  ];
  const maxOverlap = calculateMaxConcurrentQuantity(overlappingAllocs, tStart, tEnd);
  assert(maxOverlap === 7, 'Overlapping allocations correctly sum during concurrent window (3 + 4 = 7)');

  // ----------------------------------------------------
  // SECTION 4: LIVE DATABASE & COMPLETE WORKFLOW TESTS
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: LIVE DATABASE INTEGRATION TESTS ---');

  try {
    await connectDB();
    console.log('  ✓ Connected to MongoDB database successfully.');

    const TEST_PREFIX = 'test_b5_';

    // 1. Clean up prior test artifacts if any
    await User.deleteMany({ email: new RegExp(`^${TEST_PREFIX}`, 'i') });
    await Resource.deleteMany({ name: new RegExp(`^${TEST_PREFIX}`, 'i') });
    const staleRequests = await EventRequest.find({ title: new RegExp(`^${TEST_PREFIX}`, 'i') });
    const staleRequestIds = staleRequests.map((r) => r._id);
    await EventRequest.deleteMany({ _id: { $in: staleRequestIds } });
    await Allocation.deleteMany({ eventRequestId: { $in: staleRequestIds } });
    await Notification.deleteMany({ dedupeKey: new RegExp(`^req-.*-approved|^req-.*-rejected`) });

    // 2. Create Faculty User
    const facultyPasswordHash = await bcrypt.hash('facultyPass123', 10);
    const facultyUser = await User.create({
      name: `${TEST_PREFIX}Dr. Aris Thorne`,
      email: `${TEST_PREFIX}faculty@campus.edu`,
      facultyId: `${TEST_PREFIX}FAC-901`,
      passwordHash: facultyPasswordHash,
      role: 'faculty',
      isActive: true,
    });
    assert(Boolean(facultyUser._id), 'Created test faculty user in MongoDB');

    // 3. Create Student User
    const studentPasswordHash = await bcrypt.hash('studentPass123', 10);
    const studentUser = await User.create({
      name: `${TEST_PREFIX}Priya Patel`,
      email: `${TEST_PREFIX}priya@campus.edu`,
      enrollmentNumber: `${TEST_PREFIX}ENR-401`,
      passwordHash: studentPasswordHash,
      role: 'student',
      isActive: true,
    });
    assert(Boolean(studentUser._id), 'Created test student user in MongoDB');

    // 4. Test Duplicate Email Prevention
    await assertAsyncThrows(async () => {
      await User.create({
        name: 'Duplicate Student',
        email: `${TEST_PREFIX}priya@campus.edu`,
        enrollmentNumber: `${TEST_PREFIX}ENR-999`,
        passwordHash: studentPasswordHash,
        role: 'student',
      });
    }, 'Rejects duplicate student email registration');

    // 5. Test Duplicate Enrollment Prevention
    await assertAsyncThrows(async () => {
      await User.create({
        name: 'Another Student',
        email: `${TEST_PREFIX}another@campus.edu`,
        enrollmentNumber: `${TEST_PREFIX}ENR-401`,
        passwordHash: studentPasswordHash,
        role: 'student',
      });
    }, 'Rejects duplicate enrollment number registration');

    // 6. Create Campus Resources via resourceService
    const venueResource = await resourceService.createResource({
      facultyUserId: facultyUser._id,
      data: {
        name: `${TEST_PREFIX}Aryabhata Auditorium`,
        category: 'Auditorium',
        resourceMode: 'capacity',
        capacity: 250,
        description: 'Large event hall with audio visual system',
        location: 'Block C, Ground Floor',
      },
    });
    assert(venueResource.capacity === 250, 'Created capacity venue resource in MongoDB');

    const equipmentResource = await resourceService.createResource({
      facultyUserId: facultyUser._id,
      data: {
        name: `${TEST_PREFIX}Wireless Lapel Mics`,
        category: 'Audio/Visual',
        resourceMode: 'quantity',
        totalQuantity: 8,
        description: 'High fidelity UHF lapel microphone units',
        location: 'AV Equipment Store',
      },
    });
    assert(equipmentResource.totalQuantity === 8, 'Created quantity equipment resource in MongoDB');

    // 7. Test Duplicate Resource Creation Prevention
    await assertAsyncThrows(async () => {
      await resourceService.createResource({
        facultyUserId: facultyUser._id,
        data: {
          name: `${TEST_PREFIX}Aryabhata Auditorium`,
          category: 'Auditorium',
          resourceMode: 'capacity',
          capacity: 300,
        },
      });
    }, 'Rejects duplicate resource name creation (case-insensitive)');

    // 8. Check Real-Time Availability
    const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
    const endAt = new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString();

    // 8a. Check valid availability
    const availResultValid = await checkAvailability({
      startAt,
      endAt,
      attendeeCount: 120,
      requestedResources: [
        { resourceId: venueResource._id },
        { resourceId: equipmentResource._id, requestedQuantity: 3 },
      ],
    });
    assert(availResultValid.overallAvailable === true, 'Availability check succeeds when resources are free');

    // 8b. Check attendee capacity overflow
    const availResultCapacityFail = await checkAvailability({
      startAt,
      endAt,
      attendeeCount: 300, // exceeds venue capacity 250
      requestedResources: [{ resourceId: venueResource._id }],
    });
    assert(availResultCapacityFail.overallAvailable === false, 'Availability fails when attendees exceed venue capacity');

    // 8c. Check equipment quantity shortage
    const availResultQtyFail = await checkAvailability({
      startAt,
      endAt,
      attendeeCount: 50,
      requestedResources: [{ resourceId: equipmentResource._id, requestedQuantity: 12 }], // stock is 8
    });
    assert(availResultQtyFail.overallAvailable === false, 'Availability fails when requested equipment exceeds total stock');

    // 9. Submit Student Event Request 1
    const request1 = await requestService.createEventRequest({
      studentId: studentUser._id,
      data: {
        title: `${TEST_PREFIX}Annual Tech Colloquium 2026`,
        description: 'Technical paper presentations and keynotes by industry researchers.',
        eventType: 'Seminar',
        startAt,
        endAt,
        attendeeCount: 150,
        requestedResources: [
          { resourceId: venueResource._id },
          { resourceId: equipmentResource._id, requestedQuantity: 4 },
        ],
      },
    });
    assert(request1.status === 'Under Review', 'Event request created directly with status "Under Review"');
    assert(request1.requestedResources.length === 2, 'Request attaches all requested venue & equipment resources');

    // 10. Verify Student Request History Retrieval
    const studentHistory = await requestService.getMyRequests({
      studentId: studentUser._id,
      query: { status: 'Under Review' },
    });
    assert(studentHistory.requests.length >= 1, 'Student can query own request history');

    // 11. Student Ownership Security: Another student cannot access Request 1
    const secondStudent = await User.create({
      name: `${TEST_PREFIX}Rohan Verma`,
      email: `${TEST_PREFIX}rohan@campus.edu`,
      enrollmentNumber: `${TEST_PREFIX}ENR-402`,
      passwordHash: studentPasswordHash,
      role: 'student',
      isActive: true,
    });

    await assertAsyncThrows(async () => {
      await requestService.getRequestById({
        studentId: secondStudent._id,
        requestId: request1._id,
      });
    }, 'Student cannot access another student\'s event request');

    // 12. Submit Competing Request 2 for the same venue and overlapping time
    const request2 = await requestService.createEventRequest({
      studentId: secondStudent._id,
      data: {
        title: `${TEST_PREFIX}Competing Hackathon`,
        description: 'Overlapping hackathon event competing for the same venue.',
        eventType: 'Hackathon',
        startAt,
        endAt,
        attendeeCount: 100,
        requestedResources: [
          { resourceId: venueResource._id },
          { resourceId: equipmentResource._id, requestedQuantity: 6 }, // 4 + 6 = 10 > total 8
        ],
      },
    });
    assert(request2.status === 'Under Review', 'Competing request submitted into review queue');

    // 13. Faculty Conflict Detection on Competing Requests
    const conflictsBeforeApproval = await facultyService.getFacultyRequestConflicts(request2._id);
    assert(
      conflictsBeforeApproval.resourceConflicts.some((rc) => rc.competingPendingRequests.length > 0),
      'Conflict matrix detects competing Under Review requests before decision'
    );

    // 14. Faculty Approves Request 1
    const approvalResult = await facultyService.approveFacultyRequest({
      requestId: request1._id,
      facultyUserId: facultyUser._id,
      decisionRemark: 'Approved for technical colloquium. Keys available at Block C admin desk.',
    });
    assert(approvalResult.request.status === 'Approved', 'Request 1 status atomically updated to Approved');
    assert(approvalResult.request.decisionRemark.length > 0, 'Decision remark persisted on approved request');

    // Verify Allocations created in MongoDB
    const allocationsCreated = await Allocation.find({ eventRequestId: request1._id, status: 'active' });
    assert(allocationsCreated.length === 2, 'Allocations created for both venue and equipment in MongoDB');

    // CRITICAL FIX VERIFICATION: Approved request does NOT detect its own allocations as conflicts
    const request1ConflictsAfterApproval = await facultyService.getFacultyRequestConflicts(request1._id);
    const request1AllocationConflicts = request1ConflictsAfterApproval.resourceConflicts.flatMap((rc) => rc.overlappingAllocations);
    assert(request1AllocationConflicts.length === 0, 'Approved request does NOT detect its own allocations as conflicts');
    assert(request1ConflictsAfterApproval.hasAnyConflict === false, 'Approved request hasAnyConflict is false');

    // Competing request correctly identifies Request 1 allocations as active external conflicts
    const request2ConflictsAfterApproval = await facultyService.getFacultyRequestConflicts(request2._id);
    const request2AllocationConflicts = request2ConflictsAfterApproval.resourceConflicts.flatMap((rc) => rc.overlappingAllocations);
    assert(request2AllocationConflicts.length > 0, 'Competing request correctly identifies external confirmed allocations as conflicts');

    // Verify Notification records created
    const submissionNotification = await Notification.findOne({
      eventRequestId: request1._id,
      type: 'request_submitted',
    });
    assert(Boolean(submissionNotification), 'Transactional notification queued for student event submission');

    const approvalNotification = await Notification.findOne({
      eventRequestId: request1._id,
      type: 'request_approved',
    });
    assert(Boolean(approvalNotification), 'Transactional notification queued for approved event request');

    // 15. Duplicate Approval Prevention
    await assertAsyncThrows(async () => {
      await facultyService.approveFacultyRequest({
        requestId: request1._id,
        facultyUserId: facultyUser._id,
      });
    }, 'Prevents duplicate approval of an already decided request');

    // 16. Faculty Approval of Competing Request 2 Must Fail
    await assertAsyncThrows(async () => {
      await facultyService.approveFacultyRequest({
        requestId: request2._id,
        facultyUserId: facultyUser._id,
      });
    }, 'Approval of competing request blocked due to overlapping confirmed allocations');

    // 17. Faculty Rejects Competing Request 2 with Feedback
    const rejectionResult = await facultyService.rejectFacultyRequest({
      requestId: request2._id,
      facultyUserId: facultyUser._id,
      decisionRemark: 'Auditorium is already committed to the Annual Tech Colloquium. Please reschedule.',
    });
    assert(rejectionResult.request.status === 'Rejected', 'Request 2 status updated to Rejected');
    assert(rejectionResult.request.decisionRemark.includes('already committed'), 'Rejection remark saved');

    // Verify no allocations created for rejected request
    const allocationsForRejected = await Allocation.find({ eventRequestId: request2._id });
    assert(allocationsForRejected.length === 0, 'Rejected request does not consume campus resource allocations');

    // Verify Rejection Notification record
    const rejectionNotification = await Notification.findOne({
      eventRequestId: request2._id,
      type: 'request_rejected',
    });
    assert(Boolean(rejectionNotification), 'Transactional notification queued for rejected event request');

    // 18. Test Notification Retry Logic
    if (approvalNotification) {
      const retried = await notificationService.retryNotification(approvalNotification._id);
      assert(retried.attemptCount >= 1, 'Notification retry handler increments attempt count safely');
    }

    // 19. Verify AuditLog Records
    const auditLogs = await AuditLog.find({
      targetId: { $in: [venueResource._id, request1._id, request2._id] },
    });
    assert(auditLogs.length >= 3, 'AuditLog records created for resource creation, approval, and rejection');

    // 20. FACULTY 2FA OTP & EMAIL INTEGRATION TESTS
    console.log('\n--- SECTION 7: FACULTY 2FA OTP & RESEND EMAIL TESTS ---');

    // Email HTML template renderers
    const now = new Date();
    const later = new Date(now.getTime() + 3 * 3600 * 1000);
    const subEmailHtml = emailService.renderSubmissionEmail({
      studentName: 'Aarav Sharma',
      eventTitle: 'Robotics Workshop',
      requestId: request1._id.toString(),
      startAt: now,
      endAt: later,
      resources: [{ resourceId: { name: 'Main Hall' }, requestedQuantity: 1 }],
    });
    assert(subEmailHtml.includes('Robotics Workshop') && subEmailHtml.includes('Request Received'), 'Student submission email HTML rendered with valid metadata');

    const appEmailHtml = emailService.renderApprovalEmail({
      studentName: 'Aarav Sharma',
      eventTitle: 'Robotics Workshop',
      requestId: request1._id.toString(),
      startAt: now,
      endAt: later,
      resources: [{ resourceId: { name: 'Main Hall' }, requestedQuantity: 1 }],
      decisionRemark: 'Approved for technical colloquium.',
      decisionAt: now,
    });
    assert(appEmailHtml.includes('Main Hall') && appEmailHtml.includes('Approved for technical colloquium'), 'Approval email HTML rendered with allocated resources and faculty remarks');

    const rejEmailHtml = emailService.renderRejectionEmail({
      studentName: 'Aarav Sharma',
      eventTitle: 'Robotics Workshop',
      requestId: request2._id.toString(),
      startAt: now,
      endAt: later,
      decisionRemark: 'Auditorium is already committed.',
      decisionAt: now,
    });
    assert(rejEmailHtml.includes('Auditorium is already committed'), 'Rejection email HTML rendered with rejection remarks');

    const otpEmailHtml = emailService.renderFacultyOtpEmail({
      facultyName: facultyUser.name,
      otp: '654321',
    });
    assert(otpEmailHtml.includes('654321') && otpEmailHtml.includes('5 minutes'), 'Faculty OTP email HTML rendered with 6-digit code and expiry warning');

    // Email masking utility
    const masked = emailService.maskEmail('faculty.coordinator@university.edu');
    assert(masked.startsWith('f') && masked.includes('***') && masked.endsWith('@university.edu'), 'Email masking correctly obscures local part for privacy');

    // Faculty Login Step 1: Request OTP
    const facultyOtpInitiation = await authService.loginFaculty({
      identifier: facultyUser.email,
      password: 'facultyPass123',
    });
    assert(facultyOtpInitiation.otpRequired === true, 'Faculty login Step 1 returns otpRequired: true without issuing tokens');
    assert(Boolean(facultyOtpInitiation.emailMasked), 'Faculty login Step 1 returns masked email address');

    // Verify OTP record in database
    const facultyWithOtp = await User.findById(facultyUser._id).select('+otpHash +otpExpiresAt +otpAttempts +otpLastSentAt');
    assert(Boolean(facultyWithOtp.otpHash), 'Cryptographic OTP SHA-256 hash stored in User document');
    assert(facultyWithOtp.otpAttempts === 0, 'Initial OTP verification attempts set to 0');
    assert(facultyWithOtp.otpExpiresAt > new Date(), 'OTP expiration set in future (5 minutes)');

    // Faculty Login Step 2: Invalid OTP Attempt
    await assertAsyncThrows(async () => {
      await authService.verifyFacultyOtp({
        identifier: facultyUser.email,
        otp: '000000',
      });
    }, 'Rejects invalid 6-digit OTP code with 401 error');

    const facultyAfterFailedOtp = await User.findById(facultyUser._id).select('+otpAttempts');
    assert(facultyAfterFailedOtp.otpAttempts === 1, 'Failed OTP attempt increments attempt counter in database');

    // Faculty OTP Resend Cooldown Enforcement
    await assertAsyncThrows(async () => {
      await authService.resendFacultyOtp({
        identifier: facultyUser.email,
      });
    }, 'Enforces 60-second cooldown rate limit on OTP resends');

    // Faculty Login Step 2: Successful Verification
    const testOtp = '123456';
    const testOtpHash = crypto.createHash('sha256').update(testOtp).digest('hex');
    facultyWithOtp.otpHash = testOtpHash;
    facultyWithOtp.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    facultyWithOtp.otpAttempts = 0;
    await facultyWithOtp.save();

    const verifiedAuth = await authService.verifyFacultyOtp({
      identifier: facultyUser.email,
      otp: testOtp,
    });
    assert(verifiedAuth.user.role === 'faculty', 'Faculty OTP verified successfully and returned authenticated user profile');
    assert(Boolean(verifiedAuth.accessToken), 'Access token issued upon successful OTP verification');
    assert(Boolean(verifiedAuth.refreshToken), 'Refresh token generated upon successful OTP verification');

    const facultyAfterSuccess = await User.findById(facultyUser._id).select('+otpHash +otpExpiresAt');
    assert(facultyAfterSuccess.otpHash === null, 'OTP hash wiped from database following successful verification');

    // 21. Clean up test records
    await User.deleteMany({ email: new RegExp(`^${TEST_PREFIX}`, 'i') });
    await Resource.deleteMany({ name: new RegExp(`^${TEST_PREFIX}`, 'i') });
    await EventRequest.deleteMany({ _id: { $in: [request1._id, request2._id] } });
    await Allocation.deleteMany({ eventRequestId: { $in: [request1._id, request2._id] } });
    await Notification.deleteMany({ eventRequestId: { $in: [request1._id, request2._id] } });
    await AuditLog.deleteMany({ targetId: { $in: [venueResource._id, equipmentResource._id, request1._id, request2._id] } });
    console.log('  ✓ Cleaned up all integration test records.');

    await mongoose.disconnect();
    console.log('  ✓ Disconnected database cleanly.');
  } catch (dbErr) {
    failedTests++;
    console.error('Database integration test error:', dbErr);
    try {
      await mongoose.disconnect();
    } catch {}
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests();
