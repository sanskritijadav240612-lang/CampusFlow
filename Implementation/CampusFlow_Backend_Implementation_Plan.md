# CampusFlow – Backend Implementation Plan

## 1. Purpose of This Document

This document is the detailed backend development blueprint for **CampusFlow – AI-Powered Campus Event & Resource Management System**. It explains how to build the backend feature by feature, how the frontend will communicate with it, how the MongoDB data will be organised, and how AI, resource availability, faculty decisions, and email notifications will work together.

The backend will be a separate application inside the project root:

```text
CampusFlow/
├── Implementation/
│   ├── Frontend_Implementation_Plan.md
│   └── Backend_Implementation_Plan.md
├── frontend/
├── backend/
└── .gitignore
```

The backend will use **Node.js, Express.js, MongoDB, and Mongoose**. It will expose REST APIs for the React frontend and will own all important business rules. The browser must never be trusted to decide whether a resource is available, whether a user is authorised, or whether a request can be approved.

The goal is to implement a reliable end-to-end flow:

**Student describes an event → AI extracts structured details → backend validates the details → backend checks resource availability → request is created for faculty review → faculty approves or rejects → allocation is updated → Resend sends the decision email.**

---

## 2. Confirmed Project Decisions

The backend must follow these project decisions throughout development:

1. The project uses the MERN stack, with separate `frontend/` and `backend/` folders.
2. There are two portal roles: **Student** and **Faculty/Admin**.
3. Students can register using their name, college email, enrollment number, and password.
4. Faculty/Admin accounts are created directly in MongoDB before they use the platform. **There will be no faculty signup API or faculty signup page.**
5. Faculty/Admin log in using their college email or unique Faculty ID and password.
6. Students explain their event requirements using natural language through the AI chat interface.
7. AI is responsible for understanding and extracting information. The backend application code is responsible for validation, database queries, availability, and approval rules.
8. Faculty/Admin make the final approval or rejection decision.
9. The only **Event Request** statuses are `Under Review`, `Approved`, and `Rejected`.
10. Do not create `Submitted` or `Needs Clarification` as request statuses. A conversation can still ask follow-up questions; this is a conversation state, not an event-request status.
11. Resources can be capacity-based, such as a seminar hall, or quantity-based, such as microphones and projectors.
12. Faculty/Admin can view overlapping requests, decide which request to approve, and add resources.
13. **Resend** is the email service. It must only be called from the backend. Its API key must never be exposed to React.
14. Authentication uses **JWT access and refresh tokens**. Access tokens are short-lived and sent in the `Authorization: Bearer` header. Refresh tokens are stored in an HTTP-only cookie, rotated through a refresh endpoint, and never exposed to React JavaScript.

### Important separation of responsibilities

| Area | Backend responsibility |
|---|---|
| Authentication | Validate credentials, hash passwords, issue and verify JWTs, rotate/revoke refresh tokens, and enforce roles. |
| AI chat | Send messages to the AI provider, validate structured output, manage conversation history. |
| Availability | Read resource records and existing approved allocations; calculate availability. |
| Event requests | Validate final details and create a request with `Under Review` status. |
| Faculty decisions | Verify faculty access, re-check resource availability, and approve or reject requests. |
| Resource management | Validate and store resource records. |
| Email | Send approval/rejection notifications through Resend and record delivery results. |

---

## 3. Recommended Backend Technology Stack

| Area | Technology | Purpose |
|---|---|---|
| Runtime | Node.js | Run the server-side JavaScript application. |
| Backend framework | Express.js | Create REST APIs and middleware. |
| Database | MongoDB | Store users, resources, conversations, event requests, allocations, and notification records. |
| ODM | Mongoose | Define schemas, validate documents, and query MongoDB. |
| Input validation | Zod | Validate request bodies, query parameters, and AI output. |
| Password hashing | bcrypt | Store password hashes instead of plain-text passwords. |
| Authentication | jsonwebtoken | Sign and verify short-lived access tokens and refresh tokens. |
| Refresh-token handling | Node.js `crypto` module + Mongoose | Hash refresh tokens before storing them and support token rotation/revocation. |
| Cookie handling | cookie-parser | Read and clear the HTTP-only refresh-token cookie. |
| Security headers | Helmet | Add commonly used HTTP security headers. |
| CORS | cors | Allow requests only from the configured frontend origin. |
| Rate limiting | express-rate-limit | Limit repeated login, registration, and AI requests. |
| Email | Resend Node SDK | Send decision emails from the backend. |
| AI integration | An AI provider SDK/API, selected during implementation | Interpret natural-language event messages and return structured data. |
| Environment variables | dotenv | Load local backend configuration. |

### Why use access and refresh JWTs?

Use two JWTs with separate secrets and purposes:

- **Access token:** short-lived (recommended starting point: 15 minutes). Return it in the login/refresh response and keep it in React memory only. Send it with protected API requests using `Authorization: Bearer <accessToken>`.
- **Refresh token:** longer-lived (recommended starting point: 7 days). Store it only in an HTTP-only cookie. JavaScript must never read or store this token.

Store only a SHA-256 hash of the current refresh token in the user's MongoDB record. When `/api/auth/refresh` is called, verify the refresh JWT, compare its hash with the stored hash, issue a new access token and a new refresh token, and replace the stored hash. This is refresh-token rotation. On logout, clear the stored refresh-token hash/expiry and clear the cookie.

Use different secrets for access and refresh tokens (`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`). The React application must not store access or refresh tokens in `localStorage` or `sessionStorage`; the access token remains in memory and is recreated using the refresh endpoint after a page reload. With one refresh-token hash stored on the User document, the first version supports one active refresh session per account; multiple simultaneous devices can be added later with a separate refresh-token collection if required.

Use exact-origin CORS and send credentials only for refresh/logout requests that need the HTTP-only cookie. Set the refresh cookie as `httpOnly`, `sameSite: 'lax'` (or stricter when compatible), and `secure` in production. If a future cross-site setup requires `SameSite=None`, add CSRF protection for cookie-based refresh/logout routes. Normal protected application APIs use the access token in the Authorization header.

Do not install every package on day one. Add dependencies as the relevant backend phase begins.

---

## 4. Overall Backend Architecture

Use a modular Express architecture. Routes receive HTTP requests, middleware checks access and validation, controllers coordinate the request, services implement the business logic, and models communicate with MongoDB.

```text
React Frontend
      |
      | HTTPS / REST API
      v
Express Server
      |
      ├── Routes
      |     ├── Authentication
      |     ├── AI Conversations
      |     ├── Student Requests
      |     ├── Faculty Requests
      |     └── Resources
      |
      ├── Middleware
      |     ├── JWT Access-Token Authentication
      |     ├── Role Authorisation
      |     ├── Request Validation
      |     ├── Rate Limiting
      |     └── Error Handling
      |
      ├── Controllers
      |     └── Coordinate API input/output
      |
      ├── Services
      |     ├── Authentication Service
      |     ├── AI Service
      |     ├── Resource Matching Service
      |     ├── Availability Service
      |     ├── Request Service
      |     ├── Allocation Service
      |     └── Email Service (Resend)
      |
      └── Mongoose Models
            └── MongoDB
```

### Main architectural rule

Keep business logic out of route files and keep controllers thin. For example, the approval controller should not contain all the overlap calculations. It should validate the incoming action, call the request/approval service, and return the result.

---

## 5. Backend Folder Structure

Use the following structure as the target organisation. Create folders and files when their features are being implemented instead of creating a large number of empty files at the beginning.

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   ├── jwt.js
│   │   └── cors.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Resource.js
│   │   ├── Conversation.js
│   │   ├── EventRequest.js
│   │   ├── Allocation.js
│   │   ├── Notification.js
│   │   └── AuditLog.js
│   │
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── auth.routes.js
│   │   ├── ai.routes.js
│   │   ├── request.routes.js
│   │   ├── faculty.routes.js
│   │   └── resource.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── ai.controller.js
│   │   ├── request.controller.js
│   │   ├── faculty.controller.js
│   │   └── resource.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── ai.service.js
│   │   ├── resourceMatching.service.js
│   │   ├── availability.service.js
│   │   ├── request.service.js
│   │   ├── allocation.service.js
│   │   ├── faculty.service.js
│   │   ├── email.service.js
│   │   └── notification.service.js
│   │
│   ├── middleware/
│   │   ├── requireAuth.js
│   │   ├── requireRole.js
│   │   ├── validate.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   └── rateLimiters.js
│   │
│   ├── validators/
│   │   ├── auth.schemas.js
│   │   ├── ai.schemas.js
│   │   ├── request.schemas.js
│   │   ├── faculty.schemas.js
│   │   └── resource.schemas.js
│   │
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── dateTime.js
│   │   ├── pagination.js
│   │   └── response.js
│   │
│   ├── scripts/
│   │   └── seedFaculty.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### File responsibilities

- `server.js`: load configuration, connect to MongoDB, and start listening for requests.
- `app.js`: create the Express app and register middleware and routes.
- `routes/`: define endpoint paths and attach middleware/controllers.
- `controllers/`: read validated input and return HTTP responses.
- `services/`: implement actual application logic.
- `models/`: define MongoDB document structures and indexes.
- `validators/`: define Zod schemas for incoming data and AI output.
- `middleware/`: authenticate, authorise, validate, rate-limit, and handle errors.
- `scripts/`: one-time or repeatable backend commands, including creating pre-approved faculty accounts.
- `tests/`: test individual calculations and complete API flows.

---

# PART A — DATABASE DESIGN

## 6. Feature 1: MongoDB Connection and Configuration

### Purpose

Create a stable connection between the Express server and MongoDB before implementing application features.

### Implementation

1. Create the MongoDB database for CampusFlow.
2. Add the MongoDB connection URI to the backend environment file.
3. Create `config/db.js` to connect using Mongoose.
4. Handle connection errors clearly. Do not start accepting normal API traffic if the required database connection is unavailable.
5. Add a health endpoint that reports whether the server and database are ready.
6. Keep connection logic out of route and controller files.

### Completion check

- Server connects to the intended database.
- Server reports a clear error if the connection fails.
- A health check returns the server/database state.
- No database credentials are committed to Git.

---

## 7. Feature 2: User Model

### Purpose

Store student accounts and the pre-created faculty accounts in one user collection while keeping the two portal roles separate.

### Recommended fields

| Field | Type / purpose |
|---|---|
| `name` | User's full name. |
| `email` | Normalised, lowercase college email. |
| `passwordHash` | bcrypt password hash. Never store a plain-text password. |
| `role` | `student` or `faculty`. The `faculty` role represents the Faculty/Admin portal in this version. |
| `enrollmentNumber` | Required for students; unique. |
| `facultyId` | Required for faculty; unique. |
| `isActive` | Allows an account to be disabled without deleting its history. |
| `refreshTokenHash` | SHA-256 hash of the currently valid refresh token; never store the raw token. |
| `refreshTokenExpiresAt` | Expiry timestamp for the stored refresh token. |
| `createdAt`, `updatedAt` | Timestamps. |

### Validation and indexes

- Email must be normalised before saving and must be unique.
- A student must have an enrollment number; a faculty user must have a Faculty ID.
- Enrollment numbers must be unique among student accounts.
- Faculty IDs must be unique among faculty accounts.
- Use role-specific validation so student-only and faculty-only fields are not mixed.
- Exclude `passwordHash` from normal API responses and from default queries where practical.
- Exclude `refreshTokenHash` and `refreshTokenExpiresAt` from normal API responses and never return the raw refresh token except as the HTTP-only cookie.

### Important role decision

Use two portal roles in the first version: `student` and `faculty`. Faculty/Admin is the name of the management portal, not a public third signup role. If separate super-admin permissions are needed later, they should be added deliberately rather than allowing users to choose an admin role during registration.

### Completion check

- Both account types can be represented safely.
- Unique identity fields cannot be duplicated.
- Password hashes are not returned by API responses.

---

## 8. Feature 3: Resource Model

### Purpose

Represent campus facilities and equipment in a way that supports both venues with capacity and equipment with a limited quantity.

### Recommended fields

| Field | Type / purpose |
|---|---|
| `name` | Resource name, e.g. Seminar Hall A or Projector. |
| `category` | Venue, Laboratory, Audio, Display, or another agreed category. |
| `resourceMode` | `capacity` or `quantity`. |
| `capacity` | Maximum people for a capacity-based resource. |
| `totalQuantity` | Total number of units for a quantity-based resource. |
| `description` | Optional details. |
| `location` | Optional building/room location. |
| `isActive` | Whether the resource can be requested. |
| `scheduleVersion` | Internal version used when serialising concurrent approval operations. |
| `createdBy` | Faculty user who added the resource. |
| `createdAt`, `updatedAt` | Timestamps. |

### Resource modes

**Capacity-based resource:** A seminar hall or laboratory has a maximum attendee capacity. The requested attendee count must not exceed the resource capacity. For the initial version, one capacity-based venue cannot host two approved events at overlapping times.

**Quantity-based resource:** Microphones and projectors have a total quantity. The backend calculates how many units are already allocated during the requested time and checks whether the remaining quantity can fulfil the new request.

### Validation rules

- `capacity` is required and positive for `capacity` resources.
- `totalQuantity` is required and positive for `quantity` resources.
- Only the field relevant to the selected `resourceMode` is used.
- Inactive resources must not be offered for new requests or new allocations.

### Important rule

Do not store a manually edited `availableQuantity` as the source of truth. Availability changes with the requested date and time. Calculate it from the resource's total capacity/quantity and the allocation records that overlap the requested time.

### Completion check

A capacity-based resource and a quantity-based resource can both be created and correctly represented in MongoDB.

---

## 9. Feature 4: Conversation Model

### Purpose

Preserve the student's AI chat so the student can provide event details over multiple messages without turning the conversation into an event request too early.

### Recommended fields

- `studentId`: owner of the conversation.
- `messages`: ordered messages with `role` (`user` or `assistant`), `content`, and timestamp.
- `draft`: latest structured event details extracted by the AI.
- `conversationStage`: for example `collecting_details` or `ready_for_review`.
- `createdAt`, `updatedAt`.

### Important status distinction

`conversationStage` belongs only to the chat conversation. It is not an Event Request status. Do not add `Needs Clarification` to the Event Request status enum.

### Data handling

- A student can only read or continue their own conversations.
- Limit message length and conversation history sent to the AI provider.
- Store only the information needed for the request workflow.
- Validate the AI-produced draft before saving it.

### Completion check

A student can start a conversation, send multiple messages, and resume their own conversation without another student's messages being exposed.

---

## 10. Feature 5: Event Request Model

### Purpose

Store the final event details sent by a student for Faculty/Admin review.

### Recommended fields

**Student and conversation references**
- `studentId`: the requesting student.
- `conversationId`: related conversation, if one was used.

**Event details**
- `title` or event name.
- `description`.
- `eventType`, if identified/provided.
- `startAt` and `endAt` as date-time values stored consistently (recommended: UTC in MongoDB).
- `attendeeCount`.

**Requested resources**
- An array of selected resources, each containing:
  - `resourceId`.
  - `requestedQuantity` for quantity-based resources.
  - Any resource-specific requirement that has been agreed by the project.

**Decision information**
- `status`: exactly `Under Review`, `Approved`, or `Rejected`.
- `decisionBy`: faculty user reference when a decision is made.
- `decisionAt`: time of decision.
- `decisionRemark`: optional faculty explanation, especially useful for rejection.

**Timestamps**
- `createdAt`, `updatedAt`.

### Validation rules

- `endAt` must be later than `startAt`.
- `attendeeCount` must be a positive integer.
- At least one valid resource must be requested for a resource request.
- Resource IDs must refer to active resources.
- Requested quantity must be a positive integer and must be appropriate for that resource's mode.
- The authenticated student ID must come from the verified access token and the backend-loaded user (`req.user`). Never trust a student ID sent in the request body.
- A new Event Request is created directly with status `Under Review` after all submission checks pass.

### Suggested indexes

- `{ studentId: 1, createdAt: -1 }` for student history.
- `{ status: 1, createdAt: -1 }` for the faculty inbox.
- Index relevant event date fields for date filters.

### Completion check

The database stores a complete request with the correct student owner and one of the three allowed statuses.

---

## 11. Feature 6: Allocation Model

### Purpose

Record resources that have actually been reserved for approved events.

### Why keep allocations separate?

A request can be Under Review without occupying resources. An allocation is created only when Faculty/Admin approves a request. This gives the system a clear source of truth for resource availability.

### Recommended fields

- `eventRequestId`: approved request.
- `resourceId`: resource being allocated.
- `quantity`: number of units reserved for quantity-based resources; use one venue allocation for a capacity-based resource.
- `startAt`, `endAt`: reserved time range.
- `status`: `active` for a current allocation; later versions may support release/cancellation.
- `createdAt`, `updatedAt`.

### Availability query rule

An allocation overlaps the requested event when:

```text
allocation.startAt < requested.endAt
AND
allocation.endAt > requested.startAt
```

This treats touching end/start times as non-overlapping. For example, an event ending at 12:00 does not overlap an event beginning at 12:00.

### Suggested indexes

- `{ resourceId: 1, startAt: 1, endAt: 1, status: 1 }` for allocation lookup.
- `{ eventRequestId: 1 }` for finding allocations of a request.

### Completion check

Approving a request creates allocations for its requested resources. Under Review and Rejected requests do not consume resource quantity.

---

## 12. Feature 7: Notification and Audit Records

### Notification model

Record important emails so the system can track whether the decision email has been queued, sent, or failed.

Suggested fields:
- `eventRequestId`.
- `recipientEmail`.
- `type`: `request_approved` or `request_rejected`.
- `status`: `pending`, `sent`, or `failed` (this is an email delivery state, not an Event Request status).
- `providerMessageId`, when returned by Resend.
- `attemptCount`, `lastError`, `sentAt`.
- `dedupeKey` to prevent duplicate emails for the same decision.
- timestamps.

### AuditLog model

Record key management actions, especially:
- Faculty approval/rejection, including the faculty user and request ID.
- Resource creation.
- Important administrative account changes performed through approved scripts/tools.

Never log passwords, access tokens, refresh tokens, cookies, API keys, or full sensitive request payloads.

### Completion check

The application can identify who made a decision and whether the related email notification was delivered or failed.

---

# PART B — AUTHENTICATION AND ACCESS CONTROL

## 13. Feature 8: Student Registration

### Purpose

Allow a student to create an account using college identity details.

### API

`POST /api/auth/student/register`

### Expected input

- `name`
- `email`
- `enrollmentNumber`
- `password`

### Backend flow

1. Validate the body using a Zod schema.
2. Trim name and enrollment number; normalise email to lowercase.
3. Validate email format. If the college's allowed email domain is known, enforce it using a backend configuration value rather than hardcoding it in the controller.
4. Check whether the email or enrollment number already exists.
5. Hash the password using bcrypt with an appropriate work factor.
6. Create the user with role `student` and `isActive: true`.
7. Return safe user information only. Registration does not create a faculty account and does not need to issue tokens; the student uses the student login endpoint after registration.

### Error cases

- Missing or invalid fields.
- Duplicate college email.
- Duplicate enrollment number.
- Password does not meet the agreed strength rule.
- Database/server failure.

### Security rules

- Never accept a `role` value from the public registration form.
- Never accept `isActive: true` or other privilege fields from the student body.
- Never return `passwordHash`, `refreshTokenHash`, or `refreshTokenExpiresAt`.
- Rate-limit registration attempts.

### Completion check

A valid student can register, duplicate identities are rejected, and only a password hash is stored.

---

## 14. Feature 9: Student Login

### API

`POST /api/auth/student/login`

### Expected input

- `email` or the agreed student login identifier.
- `password`.

### Backend flow

1. Validate the input.
2. Find an active user with role `student` and the normalised email.
3. Compare the submitted password with `passwordHash` using bcrypt.
4. Create a short-lived access JWT and a longer-lived refresh JWT using separate secrets.
5. Hash the refresh JWT with Node's `crypto` module and save the hash and its expiry on the User document, replacing any previously active refresh token for that account.
6. Set the raw refresh JWT in an HTTP-only cookie and return the access token plus safe student profile details in the JSON response.

### Security rules

- Use a generic login error so the response does not disclose whether an email exists.
- Rate-limit failed login attempts.
- Never return the refresh token in the JSON response.
- Do not store either token in server logs, `localStorage`, or `sessionStorage`.
- Reject disabled accounts.

### Completion check

A registered student can log in, receives an access token, and can access only Student portal APIs with that token.

---

## 15. Feature 10: Pre-Created Faculty Accounts and Faculty Login

### Purpose

Allow only faculty accounts that have already been added to MongoDB to access the Faculty/Admin portal.

### No public faculty registration

Do not create any endpoint such as:

- `POST /api/auth/faculty/register`
- `POST /api/auth/faculty/signup`

Faculty records are created by a controlled seed/provisioning script, not by a form on the public website.

### Faculty seed script

Create `scripts/seedFaculty.js` or a controlled provisioning command that:

1. Reads faculty details from a secure local input or environment-based configuration.
2. Normalises the college email and Faculty ID.
3. Hashes the initial password using bcrypt.
4. Creates or safely updates the intended faculty record.
5. Never writes a plain-text password into MongoDB or source control.
6. Avoids creating duplicate records when run again.
7. Reports which record was created or updated without printing the password.

Do not commit real faculty credentials or a default shared password. Use a secure, individual initial password and arrange a secure handover to the relevant faculty member.

### API

`POST /api/auth/faculty/login`

### Expected input

- `identifier`: college email or Faculty ID.
- `password`.

### Backend flow

1. Validate the identifier and password.
2. Search only for a user with role `faculty` whose email or Faculty ID matches.
3. Confirm the account is active.
4. Compare the password against the stored hash.
5. Create an access JWT and refresh JWT, store only the refresh-token hash and expiry, and set the raw refresh token in the HTTP-only cookie.
6. Return the access token and safe faculty details. Never return the refresh token in JSON.

### Completion check

A seeded faculty record can log in. A non-existent or student account cannot use the faculty login to access the Faculty/Admin APIs. No faculty signup API exists.

---

## 16. Feature 11: JWT Token Lifecycle and Role Middleware

### Token configuration

- Use `jsonwebtoken` to sign and verify JWTs.
- Use separate secrets: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Include a subject (`sub`) containing the user ID and a token-type claim (`type: 'access'` or `type: 'refresh'`). Include the user's role in the access token; still load the user from MongoDB in the auth middleware so disabled accounts and changed roles take effect.
- Use a short access-token expiry (recommended starting point: 15 minutes) and a longer refresh-token expiry (recommended starting point: 7 days).
- Restrict verification to the expected signing algorithm and validate token type and expiry.
- Store only the SHA-256 hash of the current refresh token and its expiry in the User document. Never store the raw refresh token.
- Version 1 supports one active refresh token per account because the User document stores one current refresh-token hash. A separate refresh-token collection can support multiple devices later if required.

### Refresh-token cookie

Set the refresh token in a cookie with:
- `httpOnly: true` so browser JavaScript cannot read it.
- `secure: true` in production over HTTPS.
- `sameSite: 'lax'` (or stricter if compatible with the frontend/backend arrangement).
- A path scoped to the authentication routes where practical.
- An expiry aligned with the refresh token's lifetime.

The access token is returned in the JSON response and kept in React memory only. The frontend sends it as `Authorization: Bearer <accessToken>`. Do not save access or refresh tokens in `localStorage` or `sessionStorage`.

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/me` | Return the current authenticated user using a valid access token. |
| POST | `/api/auth/refresh` | Validate and rotate the refresh token cookie; return a new access token and set a new refresh cookie. |
| POST | `/api/auth/logout` | Revoke the stored refresh-token hash and clear the refresh cookie. |

### Refresh flow

1. The frontend calls `/api/auth/refresh` with credentials so the browser includes the HTTP-only refresh cookie.
2. The backend verifies the refresh JWT using the refresh secret and confirms its token type and expiry.
3. The backend loads the active user and compares the SHA-256 hash of the presented token with the stored `refreshTokenHash`.
4. If the token is valid, create a new access JWT and a new refresh JWT.
5. Save the new refresh-token hash and expiry before returning success, then replace the cookie with the new refresh token.
6. If the token is invalid, expired, revoked, or does not match the stored hash, reject the refresh and clear the cookie.

### Logout flow

- Read and verify the refresh cookie when present, identify its user, and clear that user's stored refresh-token hash and expiry.
- Clear the refresh cookie even if the token is missing or invalid.
- Return a successful logout response after cookie clearing/revocation.
- An already-issued access token can remain valid until its short expiry; protected APIs must reject it once expired. The frontend should immediately clear its in-memory access token on logout.

### Middleware

**`requireAuth`** reads the bearer access token from the `Authorization` header, verifies it with the access secret, loads the active user from MongoDB, and attaches safe identity data to `req.user`.

**`requireRole('student')`** allows only student users.

**`requireRole('faculty')`** allows only faculty users.

Attach these middleware functions to every protected route. A frontend route guard is helpful for the user experience but is not a security boundary.

### CORS and cookie handling

- Configure CORS with the exact frontend origin and `credentials: true`; do not allow every origin with credentials.
- Use Axios `withCredentials: true` for refresh and logout requests that need the refresh cookie. Normal protected API calls use the bearer access token.
- Use `cookie-parser` to read the refresh cookie and clear it on logout.
- `SameSite=Lax` helps limit cross-site cookie sending. If a cross-site arrangement later requires `SameSite=None`, add CSRF protection for refresh/logout routes.

### Completion check

A valid access token opens the correct role-protected APIs. After page reload, the frontend can obtain a new access token through the refresh endpoint. Refresh-token rotation replaces the old token, and logout revokes the refresh token and clears the cookie.

# PART C — AI CONVERSATION AND EVENT EXTRACTION

## 17. Feature 12: AI Service Layer

### Purpose

Interpret student messages and return structured event details without allowing the AI to perform privileged business operations.

### Provider-independent design

Create an `ai.service.js` module that hides the selected AI provider from the rest of the application. The specific provider/model can be selected during implementation. Controllers and request services should call this module rather than importing the provider SDK throughout the codebase.

### AI responsibilities

The AI may:
- Understand the event description.
- Extract event name/type and description.
- Extract date, start time, end time, and attendee count when supplied.
- Identify requested resource names and quantities.
- Identify missing or ambiguous information.
- Generate a natural-language follow-up question.
- Return a structured draft that the backend can validate.

The AI must not:
- Decide that a resource is available.
- Approve or reject an event request.
- Create or update a MongoDB request directly.
- Invent MongoDB resource IDs.
- Change the student's identity or permissions.
- Bypass backend validation.

### Structured output

Ask the AI provider for structured JSON that follows a defined schema. A conceptual response may contain:

```json
{
  "assistantMessage": "What time will the session end?",
  "isReadyForReview": false,
  "eventDraft": {
    "title": "Technical Session",
    "startAt": null,
    "endAt": null,
    "attendeeCount": 80,
    "resourceMentions": [
      { "name": "seminar hall", "quantity": 1 },
      { "name": "microphone", "quantity": 2 }
    ]
  },
  "missingFields": ["endAt"]
}
```

This is an example of the shape, not a literal API response that must be copied. Validate every AI response with Zod before using it. Invalid AI output should produce a controlled error or a safe follow-up, not a database write.

### Resource matching

The AI should identify the resource the student means in ordinary language. The backend then matches that description against active Resource records. The backend assigns the real `resourceId` only after a valid match. If the match is ambiguous, return a clarification/selection message to the student.

### Completion check

The AI service returns validated structured event data and cannot independently make availability or approval decisions.

---

## 18. Feature 13: Create and Continue AI Conversations

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/ai/conversations` | Create a conversation for the logged-in student. |
| GET | `/api/ai/conversations/:conversationId` | Fetch a conversation owned by the student. |
| POST | `/api/ai/conversations/:conversationId/messages` | Add a message and receive the assistant response and updated draft. |

### Create conversation flow

1. Student calls the create-conversation API.
2. Backend creates a Conversation document with the authenticated student ID.
3. Backend returns the conversation ID and initial conversation data.

### Send message flow

1. Confirm the student owns the conversation.
2. Validate message length and allowed input format.
3. Save the user message or prepare it for the conversation service.
4. Load a controlled amount of recent conversation context and the current draft.
5. Load the active resource catalogue or the resource names/categories required for matching.
6. Call the AI service.
7. Validate the AI output against the structured schema.
8. Resolve resource mentions against actual Resource records.
9. Update the draft and store the assistant response.
10. Return the assistant message, updated draft, missing information, and whether the draft is ready for student review.

### Conversation ownership and limits

- Students can only access their own conversation IDs.
- Enforce message-size and request-rate limits.
- Limit the number of previous messages sent to the AI provider to control cost and context size.
- Do not expose the AI API key or provider configuration to the frontend.
- Store provider errors in server logs without returning secret or internal details to the user.

### Follow-up question behaviour

If date, time, attendee count, or another required detail is missing, the assistant asks the student for it. The conversation remains active. No Event Request is created at this point, and no `Needs Clarification` request status is used.

### Completion check

The student can send multiple messages until the backend has a valid draft ready for review. Conversation access is restricted to its owner.

---

## 19. Feature 14: Event Draft Validation and Normalisation

### Purpose

Convert the AI conversation draft and student corrections into a trusted, consistent structure before checking resources.

### Backend validation

- Require a valid event title or description.
- Require a valid event start and end time.
- Confirm end time is later than start time.
- Require a positive attendee count when the event needs a venue/capacity check.
- Resolve resource mentions to active database resources.
- Require a positive quantity for quantity-based resources.
- Prevent duplicated resource entries from being counted twice; combine or reject duplicates in a predictable way.
- Reject unsupported or inactive resource IDs.

### Date and time handling

Choose the campus timezone as a backend configuration value. Interpret student-provided local event times in that timezone, validate them, and store normalised timestamps consistently (recommended: UTC). Return timestamps in a documented format for the frontend to display in the campus timezone.

### Important security rule

Treat student messages and AI output as untrusted input. The final event details must pass the same backend validation even if the AI claims the draft is complete.

### Completion check

A draft can only move to the availability stage after all mandatory details and resource references are valid.

---

# PART D — RESOURCE AVAILABILITY AND STUDENT REQUESTS

## 20. Feature 15: Availability Service

### Purpose

Calculate whether the requested resources can meet the event's requirements for the selected date and time.

### API

`POST /api/requests/check-availability`

### Expected input

A validated event draft containing:
- Event start and end time.
- Attendee count.
- Resource IDs and requested quantities.

Do not accept a student ID from the body. The verified access token identifies the student through `req.user`.

### Availability calculation

**Step 1 — Validate the time window**

Confirm the event has a valid start/end time and a positive duration.

**Step 2 — Load the resources**

Load all requested resources from MongoDB. Confirm they exist and are active.

**Step 3 — Load overlapping allocations**

Find active allocations for the same resource where `startAt < requestedEnd` and `endAt > requestedStart`.

**Step 4 — Capacity-based resources**

- Check that attendee count does not exceed the resource's capacity.
- Check whether another approved allocation already reserves the same venue for an overlapping time.
- If either condition fails, mark that resource unavailable and return a clear reason.

**Step 5 — Quantity-based resources**

- Sum the quantities allocated during the overlapping time window.
- Calculate `remaining = totalQuantity - allocatedQuantity`.
- Compare the remaining quantity with the student's requested quantity.
- Mark the resource available only if the remaining quantity is sufficient.

**Step 6 — Return a result per requested resource**

Return the overall result and the reason for each unavailable item. Do not expose private information about other students' requests in the student-facing availability response.

### Pending-request rule

Requests with status `Under Review` do not consume inventory because they have not been approved. They can overlap and appear as competing requests in the Faculty/Admin conflict view. This preserves the intended workflow where faculty can compare overlapping requests and choose which one to approve.

### Example response shape

```json
{
  "overallAvailable": false,
  "items": [
    {
      "resourceId": "resource-id",
      "resourceName": "Projector",
      "requestedQuantity": 2,
      "availableQuantity": 1,
      "available": false,
      "reason": "Only one projector is available for this time slot."
    }
  ]
}
```

### Important rule

An availability result is a snapshot, not a reservation and not a faculty approval. Availability must be checked again when the request is submitted and again immediately before approval.

### Completion check

The backend correctly handles quantity resources, capacity resources, overlapping time ranges, and unavailable resources.

---

## 21. Feature 16: Create Event Request

### Purpose

Create the actual request that appears in the Faculty/Admin inbox.

### API

`POST /api/requests`

### Backend flow

1. Authenticate the student.
2. Validate the submitted final event details and resource IDs.
3. Confirm the referenced resources are active.
4. Re-run the availability check against current approved allocations.
5. If any required resource is unavailable, do not create the request; return the updated availability result.
6. If the requirements can be met, create an Event Request with status `Under Review`.
7. Store the student ID from the JWT-authenticated user (`req.user`), not the request body.
8. Return the created request and its status.

### Why re-check availability?

A resource may have been approved for another event after the student first checked availability. The request creation endpoint must not rely on an old frontend result.

### Under Review requests may overlap

Two requests for the same resource and overlapping time may both be created as `Under Review` when no approved allocation has reserved the resource yet. The Faculty/Admin portal will show them as competing requests. Only one incompatible allocation can ultimately be approved.

### Status rule

On successful creation, the status is `Under Review`. Do not insert a temporary `Submitted` status. A chat that is still collecting missing details is not an Event Request.

### Completion check

A valid request appears in the student history and Faculty/Admin inbox as `Under Review`. An unavailable or invalid request is not incorrectly saved as a successful request.

---

## 22. Feature 17: Student Request History and Details APIs

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/requests/my` | Return only the logged-in student's requests. |
| GET | `/api/requests/:requestId` | Return one request owned by the logged-in student. |

### History endpoint behaviour

Support:
- Filtering by `Under Review`, `Approved`, or `Rejected`.
- Sorting by creation date, newest first by default.
- Pagination using `page` and `limit` or a cursor strategy.
- Safe summaries of event details and requested resources.

### Request details behaviour

Return:
- Event details.
- Requested resources and quantities.
- Creation time.
- Current request status.
- Decision time and faculty remark, when available and approved for display.

### Ownership rule

A student must not be able to retrieve another student's request by changing the request ID in the URL. Always query with both the request ID and the JWT-authenticated student ID.

### Completion check

Students only see their own requests, and the history supports the three agreed statuses.

---

# PART E — FACULTY REQUEST MANAGEMENT AND RESOURCE INVENTORY

## 23. Feature 18: Faculty Dashboard API

### API

`GET /api/faculty/dashboard`

### Information to return

- Total active resource records.
- Currently allocated/occupied quantity or spaces, based on allocations active at the current time.
- Count of requests with status `Under Review`.
- Recent requests requiring attention.
- Optional resource usage summary if needed by the agreed frontend design.

### Define occupancy consistently

For quantity-based resources, calculate the number of units allocated at the current time. For capacity-based resources, count the venues currently reserved. Do not describe all resources ever used as “currently occupied.”

### Access control

Only authenticated faculty users can access this endpoint.

### Completion check

Dashboard figures come from MongoDB queries and allocation data, not hardcoded values.

---

## 24. Feature 19: Faculty Request Inbox and Request Details

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/faculty/requests` | List requests with filters and pagination. |
| GET | `/api/faculty/requests/:requestId` | View the complete request details. |
| GET | `/api/faculty/requests/:requestId/conflicts` | Return competing requests and allocation conflicts. |

### Request inbox behaviour

- Default filter should show `Under Review` requests.
- Support status filters for `Under Review`, `Approved`, and `Rejected`.
- Support pagination.
- Add search by event name or student name if needed by the frontend plan.
- Sort requests predictably, with oldest Under Review requests first or newest first according to the final faculty workflow decision.

### Request detail response

Include the event details, student information needed for review, resource requirements, current status, and any existing allocations affecting the request.

### Conflict detection

For each requested resource, find:
1. Active allocations that overlap the event time.
2. Other `Under Review` Event Requests that request the same resource and overlap the time window.

For quantity resources, compare requested quantity with total quantity and overlapping allocation totals. Also show competing Under Review requests so the faculty member can decide among them.

### Privacy

Only faculty users may view the cross-student conflict information. A student availability response must not disclose other students' names, enrollment numbers, or private request details.

### Completion check

Faculty can identify all requests competing for a limited resource without exposing this information to student accounts.

---

## 25. Feature 20: Approve Event Request

### API

`PATCH /api/faculty/requests/:requestId/approve`

### Purpose

Approve a request and create the resource allocations in one consistent operation.

### Backend flow

1. Authenticate the user and require the `faculty` role.
2. Start a MongoDB transaction.
3. Load the Event Request and confirm its current status is `Under Review`.
4. Load all requested Resource records and verify they are active.
5. Recalculate current availability using active allocations.
6. Revalidate venue capacity and quantity totals.
7. Ensure concurrent approval operations for the same resources cannot both pass on stale availability. As part of the transaction, write/update the involved resource documents (for example, increment an internal `scheduleVersion`) so competing transactions contend on the same resource records. Handle transaction write conflicts by retrying safely and rechecking availability.
8. If any required resource is no longer available, abort the approval transaction and return a conflict response containing the latest availability/conflict information. Keep the Event Request `Under Review`; do not create partial allocations.
9. If all requirements pass, create all Allocation records.
10. Update the Event Request to `Approved`, set `decisionBy` and `decisionAt`, and store an optional decision remark if provided.
11. Create a pending notification/outbox record for the student decision email in the same transaction.
12. Commit the transaction.
13. After commit, trigger the email delivery service and write an audit record.
14. Return the updated request and notification state.

### Transaction requirement

The approval operation must be atomic: either the request status and all its allocations are saved, or none of them are. Do not approve a request if only some of its requested resources can be reserved.

MongoDB transactions require a MongoDB configuration that supports transactions (for example, a replica set). Confirm that the MongoDB instance used for development supports this before relying on transaction-based approvals.

### Completion check

A request becomes `Approved` only when every required allocation has been created successfully and conflicting concurrent approvals are prevented.

---

## 26. Feature 21: Reject Event Request

### API

`PATCH /api/faculty/requests/:requestId/reject`

### Expected input

- Optional `decisionRemark` or rejection reason, according to the final product rule.

### Backend flow

1. Authenticate the faculty user.
2. Validate the request ID and optional remark.
3. Load the request and confirm its status is `Under Review`.
4. Update status to `Rejected`.
5. Save the faculty user ID and decision time.
6. Create a pending Resend notification record.
7. Commit the database update.
8. Trigger the email service after the decision has been saved.
9. Record the action in the audit log.
10. Return the updated request and notification state.

### Rules

- Do not create allocations for a rejected request.
- Do not allow a second normal decision on an already Approved or Rejected request.
- Do not silently overwrite a previous faculty decision.

### Completion check

A faculty member can reject an Under Review request, the status changes to `Rejected`, and no resource allocation is created.

---

## 27. Feature 22: Resource Inventory and Add Resource

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/resources` | Return resource inventory to authorised faculty users. |
| POST | `/api/resources` | Add a resource. |

### Add resource input

For a capacity-based resource:
- `name`
- `category`
- `resourceMode: capacity`
- `capacity`
- Optional description/location

For a quantity-based resource:
- `name`
- `category`
- `resourceMode: quantity`
- `totalQuantity`
- Optional description/location

### Backend flow

1. Require an authenticated faculty user.
2. Validate the body with a Zod schema.
3. Ensure the fields match the selected resource mode.
4. Check for duplicate resource records according to the agreed campus naming rule.
5. Create the Resource document with `isActive: true`, a schedule version, and `createdBy` set from the JWT-authenticated user (`req.user`).
6. Return the created resource.
7. Record the resource creation in the audit log.

### Scope boundary

Adding and viewing resources are in the initial scope. Resource editing, deletion, bulk imports, department-specific permissions, and advanced maintenance schedules can be considered after the main workflow is working.

### Completion check

Faculty can add both a venue/capacity resource and a quantity-based equipment resource. The resource appears in the inventory after saving.

---

# PART F — RESEND EMAIL INTEGRATION

## 28. Feature 23: Email Notifications Through Resend

### Purpose

Send the student an email after Faculty/Admin approves or rejects an event request.

### Trigger events

For the first version, send email notifications when:
- Request status changes to `Approved`.
- Request status changes to `Rejected`.

Do not send the email directly from React. The backend owns the notification logic.

### Email service

Create `email.service.js` to:
1. Read `RESEND_API_KEY` from backend environment variables.
2. Read the configured sender address from `RESEND_FROM_EMAIL`.
3. Build the appropriate approved/rejected email using a reusable template.
4. Call the Resend SDK.
5. Return the provider message ID or a controlled error.

### Notification flow

1. Faculty decision is saved successfully in MongoDB.
2. A Notification record is created as `pending` in the same transaction as the decision.
3. After the transaction commits, the notification service attempts delivery through Resend.
4. On success, mark the notification `sent`, store the Resend message ID, and set `sentAt`.
5. On failure, mark it `failed`, store a safe error summary, and keep the decision itself unchanged.
6. Retry failed/pending messages through a controlled retry mechanism. Make retries idempotent so the same decision does not create repeated emails.

### Important reliability rule

An email provider outage must not undo a faculty decision that has already been committed. The request remains Approved or Rejected even if email delivery fails. The system should record the failure and allow a retry.

### Example email content

**Approved:** Event name, event date/time, requested resources, and confirmation that the request was approved.

**Rejected:** Event name, event date/time, decision status, and faculty remark if one was saved and is suitable to share.

### Resend setup requirements

- Create a Resend account for the project.
- Configure a sender address/domain accepted by Resend for the project.
- Store the Resend API key only in backend environment variables.
- Use a verified sender identity before production sending.
- Never put the Resend key in Vite variables or any frontend source file.

### Completion check

Approvals and rejections trigger the correct email attempt, delivery status is recorded, and email failure does not corrupt the request decision.

---

# PART G — REST API CONTRACT

## 29. Proposed API Endpoint List

These routes are the proposed API contract for backend and frontend integration. They do not exist until implemented. Keep names consistent between both folders once coding begins.

### Health

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check server and database status. |

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/student/register` | Public | Register a student. |
| POST | `/api/auth/student/login` | Public | Log in a student. |
| POST | `/api/auth/faculty/login` | Public | Log in a pre-created faculty account. |
| GET | `/api/auth/me` | Authenticated | Return the current user. |
| POST | `/api/auth/refresh` | Refresh-token cookie | Rotate the refresh token and return a new access token. |
| POST | `/api/auth/logout` | Refresh-token cookie | Revoke the refresh token and clear its cookie. |

There must be no faculty registration or signup endpoint.

### AI conversation

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/ai/conversations` | Student | Start a conversation. |
| GET | `/api/ai/conversations/:conversationId` | Conversation owner | Fetch own conversation. |
| POST | `/api/ai/conversations/:conversationId/messages` | Conversation owner | Send a message and receive the updated AI draft. |

### Student requests and availability

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/requests/check-availability` | Student | Check the current availability of requested resources. |
| POST | `/api/requests` | Student | Create a request with status Under Review. |
| GET | `/api/requests/my` | Student | Get own request history. |
| GET | `/api/requests/:requestId` | Owning student | Get own request details. |

### Faculty request management

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/faculty/dashboard` | Faculty | Get dashboard metrics. |
| GET | `/api/faculty/requests` | Faculty | List/filter requests. |
| GET | `/api/faculty/requests/:requestId` | Faculty | Get request details. |
| GET | `/api/faculty/requests/:requestId/conflicts` | Faculty | Get competing requests and allocations. |
| PATCH | `/api/faculty/requests/:requestId/approve` | Faculty | Approve and allocate resources. |
| PATCH | `/api/faculty/requests/:requestId/reject` | Faculty | Reject a request. |

### Resource management

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/resources` | Faculty | View campus resource inventory. |
| POST | `/api/resources` | Faculty | Add a resource. |

---

## 30. Standard API Response Format

Use a consistent response structure so the React frontend can handle success and errors predictably.

### Success example

```json
{
  "success": true,
  "message": "Request created successfully.",
  "data": {
    "id": "request-id",
    "status": "Under Review"
  }
}
```

### Error example

```json
{
  "success": false,
  "message": "Some requested resources are no longer available.",
  "code": "RESOURCE_UNAVAILABLE",
  "details": {
    "items": []
  }
}
```

### Expected HTTP status codes

| Code | When to use it |
|---|---|
| `200` | Successful read or update. |
| `201` | New user, conversation, request, or resource created. |
| `400` | Invalid input or malformed request. |
| `401` | No valid access token (or refresh token on the refresh endpoint). |
| `403` | Authenticated user does not have permission. |
| `404` | Requested record does not exist or is not accessible. |
| `409` | Duplicate identity, stale decision, or resource conflict. |
| `429` | Rate limit exceeded. |
| `500` | Unexpected server error. |

Do not return raw stack traces, MongoDB errors, AI provider responses, or secret configuration to the frontend.

---

# PART H — SECURITY, VALIDATION, AND RELIABILITY

## 31. Feature 24: Input Validation and Error Handling

### Validation

Use Zod schemas for:
- Student registration and login.
- Faculty login.
- AI message input and AI structured output.
- Event draft and request submission.
- Availability check.
- Faculty approval/rejection body.
- Resource creation.
- Filters, pagination, and route parameters.

Validate data at the API boundary even when the frontend already validates it.

### Error handling

Create one central error handler. Services can throw controlled application errors with a code and HTTP status. The handler converts them into the standard API response.

Handle:
- Invalid MongoDB ObjectIds.
- Duplicate-key errors.
- Validation failures.
- Unauthenticated requests.
- Role failures.
- Resource availability conflicts.
- AI provider timeouts/failures.
- Resend delivery failures.
- Unexpected server errors.

### Completion check

The API returns readable, consistent errors and does not reveal internal implementation details.

---

## 32. Feature 25: Backend Security Checklist

- Hash every password with bcrypt; never store plain text.
- Do not expose `passwordHash` in API responses.
- Never accept a role from student registration.
- Do not provide faculty signup.
- Sign access and refresh JWTs with different strong secrets.
- Keep access tokens short-lived and send them in the Authorization bearer header.
- Keep refresh tokens only in HTTP-only, secure-in-production cookies; never expose them to React JavaScript.
- Hash refresh tokens before storing them, rotate them on refresh, and revoke the stored hash on logout.
- Do not store access or refresh tokens in `localStorage` or `sessionStorage`.
- Use exact-origin CORS and appropriate SameSite/CSRF protection for refresh-cookie endpoints.
- Configure CORS for the known frontend origin only.
- Rate-limit login, registration, and AI endpoints.
- Validate all request bodies, parameters, and AI output.
- Authorise every protected API on the backend.
- Verify record ownership for student conversations and requests.
- Restrict cross-student conflict details to faculty.
- Keep MongoDB, AI, JWT, and Resend secrets in backend environment variables.
- Do not commit `.env` files.
- Use Helmet and safe production error handling.
- Never expose passwords, access tokens, refresh tokens, cookies, API keys, or unnecessary personal information in logs or API responses.
- Use database transactions for approval/allocation consistency.
- Re-check availability during approval, not only during the student's earlier availability check.

---

## 33. Environment Variables

Create `backend/.env.example` with placeholder values only. The actual `.env` file must remain local and must not be committed.

Suggested variables:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=replace_with_a_long_random_access_secret
JWT_REFRESH_SECRET=replace_with_a_different_long_random_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_COOKIE_NAME=campusflow_refresh
CAMPUS_TIMEZONE=Asia/Kolkata

# Optional: configure once the official college email domain is confirmed
ALLOWED_STUDENT_EMAIL_DOMAIN=

# AI provider configuration (provider/model chosen during implementation)
AI_API_KEY=replace_with_ai_provider_key
AI_MODEL=replace_with_selected_model

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=CampusFlow <notifications@your-verified-domain.com>
```

### Environment rules

- Keep `.env` out of Git.
- Keep `.env.example` free of real secrets.
- Never prefix backend secrets with `VITE_`.
- Validate required environment variables when the server starts and fail clearly if essential values are missing.
- Use separate credentials/configuration for development and production.

---

# PART I — TESTING

## 34. Feature 26: Unit Tests

Test business rules independently from Express routes.

### Availability tests

- Quantity resource has enough units.
- Quantity resource does not have enough units.
- Two allocations partially consume the stock.
- Allocation ends exactly when the requested event starts.
- Allocation starts exactly when the requested event ends.
- Allocation overlaps the event.
- Venue capacity is sufficient.
- Venue capacity is insufficient.
- Venue is already reserved during the same time.
- Inactive or unknown resource is rejected.

### AI validation tests

- Valid structured output is accepted.
- Missing required fields are detected.
- Incorrect date/time output is rejected.
- Unknown resource mention is not assigned a fabricated resource ID.
- Malformed AI JSON is handled safely.

### Request rules tests

- A new request receives `Under Review`.
- No request is created when a required resource is unavailable.
- Student identity comes from the verified access token and backend-loaded `req.user`.
- Only the three agreed request statuses are accepted.

### Completion check

Important calculations and rules are covered without needing to start the browser.

---

## 35. Feature 27: API Integration Tests

Test complete API flows with a test database and controlled AI/email service mocks.

### Authentication tests

- Student can register and log in, receiving an access token and refresh-token cookie.
- Duplicate student email/enrollment is rejected.
- Faculty can log in when pre-seeded and receives the same token pair.
- Faculty signup route does not exist.
- Protected APIs reject missing, invalid, expired, or incorrectly typed access tokens.
- Student cannot access faculty endpoints.
- Faculty cannot access student-owned request history.
- Refresh rotates the refresh token and rejects reuse of the old token.
- Logout revokes the stored refresh token and clears its cookie.

### Student workflow tests

- Student creates a conversation.
- Student sends a message and gets a validated draft.
- Student continues a conversation with missing details.
- Student checks availability.
- Student creates a request with `Under Review` status.
- Student cannot read another student's request or conversation.

### Faculty workflow tests

- Faculty sees requests in the inbox.
- Faculty can view conflict details.
- Faculty approves an available request.
- Approval creates all required allocations.
- Faculty cannot approve the same request twice.
- Faculty rejects a request and no allocation is created.
- Competing approvals cannot both reserve the same limited resource/time.
- Faculty can add capacity-based and quantity-based resources.

### Email tests

- Approval creates an approved notification.
- Rejection creates a rejected notification.
- Resend success marks the notification sent.
- Resend failure does not undo the saved decision.
- Retry does not send duplicate emails for the same decision.

---

# PART J — IMPLEMENTATION ORDER

## 36. Recommended Backend Development Phases

Build and test one phase at a time. Do not begin AI integration before the core database, authentication, and resource rules are stable.

### Phase 1: Backend project setup

Build:
- Initialise the `backend/` Node.js project.
- Configure Express.
- Add environment loading and validation.
- Configure MongoDB/Mongoose connection.
- Add health endpoint.
- Add central error handling and 404 handling.
- Add CORS and Helmet.

**Outcome:** The Express server starts, connects to MongoDB, and exposes a working health endpoint.

### Phase 2: Database models

Build:
- User model.
- Resource model.
- Conversation model.
- EventRequest model.
- Allocation model.
- Notification model.
- AuditLog model.
- Unique and query indexes.

**Outcome:** The database can represent all core campus users, resources, conversations, requests, and allocations.

### Phase 3: Authentication and faculty provisioning

Build:
- Student registration API.
- Student login API.
- Faculty seed/provisioning script.
- Faculty login API.
- Refresh-token rotation and logout revocation.
- Current-user endpoint.
- JWT authentication and role middleware.
- Refresh-cookie and rate-limiting configuration.

**Outcome:** Students can register/login, and only pre-created faculty accounts can access the Faculty/Admin portal.

### Phase 4: Resource management foundation

Build:
- Faculty resource list API.
- Add resource API.
- Capacity-based validation.
- Quantity-based validation.
- Resource indexes and active/inactive rule.

**Outcome:** Faculty can add and view valid campus resources.

### Phase 5: AI conversation service

Build:
- AI provider configuration.
- AI service wrapper.
- Conversation create/read APIs.
- Send-message API.
- Structured AI output schema.
- Resource-name matching.
- Draft normalisation and follow-up behaviour.

**Outcome:** Students can describe an event conversationally and the backend can build a validated event draft.

### Phase 6: Availability and student request workflow

Build:
- Availability calculation service.
- Availability API.
- Request submission API.
- Student request history API.
- Student request details API.
- Ownership checks.

**Outcome:** Students can check availability and create valid requests with status `Under Review`.

### Phase 7: Faculty request management

Build:
- Faculty dashboard API.
- Faculty request inbox API.
- Faculty request details API.
- Conflict detection API.
- Approval transaction and allocation creation.
- Rejection API.
- Audit logging for decisions.

**Outcome:** Faculty can compare overlapping requests and safely approve or reject them.

### Phase 8: Resend email integration

Build:
- Resend service.
- Approved/rejected email templates.
- Notification/outbox records.
- Delivery status tracking.
- Safe retry behaviour.

**Outcome:** Students receive decision emails through Resend, and the backend can track delivery failures.

### Phase 9: Backend testing and frontend integration

Build:
- Unit tests for resource/availability logic.
- API tests for authentication and user roles.
- Complete student workflow tests.
- Complete faculty workflow tests.
- Concurrent approval tests.
- Resend tests using a mock in automated tests.
- API contract alignment with the frontend.

**Outcome:** The backend is ready to integrate with the React application feature by feature.

---

## 37. Frontend–Backend Integration Agreement

Use the following rules when connecting the backend to the React frontend implementation plan.

| Frontend feature | Backend API/service |
|---|---|
| Student registration | `POST /api/auth/student/register` |
| Student login | `POST /api/auth/student/login` |
| Faculty login | `POST /api/auth/faculty/login` |
| Restore login state | `GET /api/auth/me` |
| Logout | `POST /api/auth/logout` |
| AI chat start | `POST /api/ai/conversations` |
| AI chat messages | `POST /api/ai/conversations/:id/messages` |
| Restore conversation | `GET /api/ai/conversations/:id` |
| Check availability | `POST /api/requests/check-availability` |
| Send request for review | `POST /api/requests` |
| Student request history | `GET /api/requests/my` |
| Student request details | `GET /api/requests/:requestId` |
| Faculty dashboard | `GET /api/faculty/dashboard` |
| Faculty request inbox | `GET /api/faculty/requests` |
| Faculty request details | `GET /api/faculty/requests/:requestId` |
| Faculty conflict panel | `GET /api/faculty/requests/:requestId/conflicts` |
| Approve request | `PATCH /api/faculty/requests/:requestId/approve` |
| Reject request | `PATCH /api/faculty/requests/:requestId/reject` |
| View resources | `GET /api/resources` |
| Add resource | `POST /api/resources` |

### Integration rules

- Agree on request and response JSON shapes before implementing both sides of an API.
- Keep the frontend API base URL in its own environment variable.
- Keep the access token in React memory and attach it to protected API calls using `Authorization: Bearer <accessToken>`.
- Use Axios `withCredentials: true` for the refresh/logout calls that need the HTTP-only refresh cookie.
- On an access-token expiry, call `/api/auth/refresh` once, update the in-memory access token, and retry the original request once. Avoid multiple simultaneous refresh calls.
- The backend is authoritative for request status, availability, and resource allocation.
- The frontend should refresh/invalidate dashboard, request, and resource data after an approval, rejection, or resource addition.
- Do not show an email as sent unless the backend response or a later delivery-status API confirms it. The initial response may report that the notification is queued.
- Use the exact status strings `Under Review`, `Approved`, and `Rejected` in both applications.

---

## 38. Features Outside the Initial Backend Scope

Keep the first backend version focused on the main event-resource workflow. The following are not required for the initial release unless the project scope is deliberately expanded:

- Faculty public registration or signup.
- Student event ticketing or attendee registration.
- Payment processing.
- AI approval or rejection of event requests.
- AI deciding actual resource availability.
- Automatic selection of a winning request among competing requests.
- Request status values named `Submitted` or `Needs Clarification`.
- Student-to-student messaging or social features.
- External calendar integrations.
- Resource deletion, bulk imports, or complex maintenance schedules.
- Advanced analytics and predictive resource planning.

---

## 39. Final Backend Outcome

When the backend is complete, it should support the entire CampusFlow workflow:

### Student side

A student can register with college details, log in, describe an event through the AI conversation, provide missing information, review a structured event draft, check resource availability, create a request for faculty review, and retrieve their own request history and details.

### Faculty/Admin side

A faculty member whose account was added to MongoDB in advance can log in, view request and resource summaries, inspect requests, compare overlapping requests, approve or reject a request, and add campus resources.

### System side

The backend securely manages JWT access and refresh tokens and role permissions, validates AI output, checks real availability from MongoDB allocation records, prevents incompatible concurrent approvals, records decisions, and sends student decision emails through Resend.

The central principle is that **AI helps understand the student's message, but the backend's validated rules and database records control availability, access, request status, and resource allocation. Faculty/Admin retain the final approval decision.**

---

## 40. Official Documentation References

Use official documentation while implementing each part. Confirm the current installation instructions and compatible versions at the time of setup.

- [Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Zod Documentation](https://zod.dev/)
- [Resend Node.js Documentation](https://resend.com/docs/send-with-nodejs)
- [jsonwebtoken Documentation](https://github.com/auth0/node-jsonwebtoken)
- [cookie-parser Documentation](https://expressjs.com/en/resources/middleware/cookie-parser.html)

