# Smart Campus – Frontend Implementation Plan

## 1. Purpose of This Document

This document explains how the frontend of **Smart Campus – AI-Powered Event & Resource Management System** will be planned and implemented, feature by feature.

It is intended to be the practical frontend blueprint before development begins. It describes the pages, user interactions, reusable components, frontend technologies, API connections, folder structure, development order, and completion checks.

The frontend will be a React web application. It will communicate with the separate Express backend through APIs. The backend will connect to MongoDB and handle AI processing, resource availability, approval decisions, authentication, and email delivery.

---

## 2. Project Decisions That the Frontend Must Follow

These decisions are part of the current project scope and should remain consistent across all pages:

1. The project uses the MERN stack, with separate root folders named `frontend/` and `backend/`.
2. There are two user roles: **Student** and **Faculty/Admin**.
3. Students can register and log in using their college details.
4. Faculty/Admin accounts are created in advance in MongoDB. There is **no faculty signup page**.
5. Faculty/Admin log in with their college email or Faculty ID and password.
6. Students describe their event in normal language through an AI chat interface.
7. The backend/AI flow extracts event details and requested resources. The backend checks actual availability using database records.
8. Faculty/Admin make the final approval or rejection decision.
9. The only request statuses are **Under Review**, **Approved**, and **Rejected**. Do not create `Submitted` or `Needs Clarification` as request statuses.
10. Resend is used by the backend to send emails. The React application must never contain the Resend API key or send email directly through Resend.

**Important distinction:** The AI chat may ask a student a follow-up question when information is missing. That is a conversation step, not a request status. A request gets the status **Under Review** when it is successfully created for faculty review.

---

## 3. Recommended Frontend Technology Stack

| Area | Technology | How it will be used |
|---|---|---|
| UI library | React.js | Build reusable pages and interactive components. |
| Development/build tool | Vite | Run the frontend during development and create the production build. |
| Language | JavaScript with JSX | Keep the implementation aligned with the current MERN/React project structure. |
| Styling | Tailwind CSS + custom CSS | Build responsive layouts and a custom visual identity without relying on a generic dashboard template. |
| Routing | React Router | Navigate between public, student, and faculty pages. |
| API requests | Axios | Send requests to the Express backend through one configured API client. |
| Server data | TanStack Query | Fetch, cache, refresh, and update requests, resources, and dashboard data. |
| Authentication state | React Context | Share the logged-in user and role across the application. |
| Form handling | React Hook Form | Manage registration, login, and resource forms. |
| Form validation | Zod | Validate user input before sending it to the backend. |
| Icons | Lucide React | Use a consistent icon set for navigation and actions. |
| Date utilities | date-fns | Format dates and times consistently. |
| Notifications | Sonner or a similar toast library | Show success, error, and action feedback inside the web application. |
| Charts | Recharts (only if needed) | Show simple resource usage information if the dashboard needs a chart. |

### Why this combination?

- React and Vite provide a straightforward setup for a React frontend that talks to a separate Express API.
- React Router keeps student and faculty navigation organized.
- TanStack Query is useful for data that comes from the backend and may change after an approval or resource update.
- React Context is enough for shared authentication information in the initial version. Redux is not necessary at the start.
- React Hook Form and Zod help keep forms consistent and validate data before API submission.
- Tailwind CSS allows quick layout work, while custom CSS design tokens and components keep the interface from looking like a copied template.

Do not install every library at once. Add each dependency when its part of the frontend is being built.

---

## 4. Overall Frontend Structure

The frontend will contain three main experiences:

### 4.1 Public Website

A public-facing introduction to the platform. It explains what the system does and guides users to the correct login or registration page.

Suggested pages:
- Home / landing page
- How it works section
- Student login and registration entry points
- Faculty login entry point

The public website should stay focused on the event-resource management problem. It should not become a separate event ticketing or social media platform.

### 4.2 Student Portal

The student portal is focused on describing an event, checking requirements, sending a request for review, and tracking the result.

### 4.3 Faculty/Admin Portal

The faculty portal is focused on reviewing requests, identifying resource conflicts, seeing resource usage, and adding resources.

Both portals should share common design elements, but their navigation and dashboard content must be role-specific.

---

## 5. Design and User Experience Direction

The interface should look like a carefully designed campus operations product, not a default admin dashboard.

### 5.1 Visual direction

- Use a distinctive visual identity instead of the usual generic blue-and-white dashboard appearance.
- A possible starting direction is warm neutral backgrounds, deep ink/graphite typography, a confident teal or green primary colour, and one bright accent for important actions. The final palette should be approved before building all pages.
- Use strong typography, clear spacing, and a consistent grid.
- Use campus, venue, and event imagery where it adds meaning, particularly on the public landing page. Do not fill every dashboard card with stock imagery.
- Keep cards purposeful. Use tables, timelines, panels, and structured layouts where they communicate information better than a grid of identical cards.
- Use subtle borders and shadows rather than heavy effects everywhere.
- Use consistent button styles, input fields, status indicators, and empty states.

### 5.2 Navigation

Use a **horizontal navigation bar** for the main authenticated dashboard experience, as requested.

The navigation should:
- Show the product identity on the left.
- Show role-specific navigation links in the main area.
- Show the user profile/menu on the right.
- Clearly highlight the currently selected section.
- Collapse into a mobile menu on small screens.

Suggested student navigation:
- Overview
- Create Request
- My Requests
- Profile

Suggested faculty navigation:
- Overview
- Requests
- Resources
- Profile

Do not show faculty signup anywhere in the public or faculty navigation.

### 5.3 Responsive behaviour

- Desktop: full horizontal navigation and wide content layout.
- Tablet: reduce gaps and use compact navigation.
- Mobile: collapsible navigation, stacked content, horizontally scrollable tables only when necessary, and full-width forms.
- The AI chat should remain usable on mobile, with the message composer easy to reach.

---

## 6. Pages and Routes

The following route list is the proposed frontend route map. The exact route names can be adjusted during coding, but the separation by role should remain.

| Route | Page | Access |
|---|---|---|
| `/` | Public landing page | Everyone |
| `/login` | Student login | Public |
| `/register` | Student registration | Public |
| `/faculty/login` | Faculty/Admin login | Public |
| `/student` | Student overview dashboard | Student only |
| `/student/create-request` | AI event request workspace | Student only |
| `/student/requests` | Student request history | Student only |
| `/student/requests/:requestId` | Request details | Owner student only |
| `/student/profile` | Student profile | Student only |
| `/faculty` | Faculty overview dashboard | Faculty/Admin only |
| `/faculty/requests` | Faculty request inbox | Faculty/Admin only |
| `/faculty/requests/:requestId` | Faculty request details | Faculty/Admin only |
| `/faculty/resources` | Resource inventory | Faculty/Admin only |
| `/faculty/profile` | Faculty profile | Faculty/Admin only |
| `*` | Not found page | Everyone |

### Route protection

- `PublicRoute` prevents an already logged-in user from being sent back to login unnecessarily.
- `StudentRoute` checks that the user is logged in and has the Student role.
- `FacultyRoute` checks that the user is logged in and has the Faculty/Admin role.
- If a user is not authenticated, redirect to the correct login page.
- If a Student tries to open a faculty URL, or faculty tries to open a student URL, show an access-denied page or redirect safely.
- These frontend checks improve navigation, but the backend must independently verify every protected API request. Hiding a page in React is not security by itself.

---

# PART A — SHARED FEATURES

## 7. Shared Feature 1: Application Layout and Reusable UI

Before building individual pages, create the shared layout and common UI components.

### Components to build

| Component | Purpose |
|---|---|
| `PublicNavbar` | Navigation for the public website. |
| `StudentNavbar` | Horizontal navigation for the student portal. |
| `FacultyNavbar` | Horizontal navigation for the faculty portal. |
| `PublicFooter` | Footer for public pages. |
| `PageHeader` | Reusable title, description, and optional action area. |
| `Button` | Primary, secondary, outline, and destructive button styles. |
| `Input` | Consistent text, email, password, and number inputs. |
| `Select` | Consistent dropdown input. |
| `StatusBadge` | Show Under Review, Approved, or Rejected. |
| `StatCard` | Show counts on dashboards. |
| `Modal` | Confirm important actions such as approve or reject. |
| `Toast` | Show brief action feedback. |
| `EmptyState` | Explain when a list has no records yet. |
| `LoadingState` | Show progress while data is loading. |
| `ErrorState` | Show a clear error and retry action. |
| `ConfirmDialog` | Confirm actions that change request or resource data. |

### Expected behaviour

- Reusable components must look and behave consistently across both portals.
- Buttons must show a disabled/loading state while an action is processing.
- Forms must show field-level validation messages.
- Lists must have clear loading, empty, and error states.
- Important actions must provide confirmation or a clear result message.

### Completion check

The public, student, and faculty layouts should share a visual language. A developer should not need to create a new button, input, badge, or modal style for every page.

---

## 8. Shared Feature 2: Authentication State and Role Handling

The frontend needs to know whether the user is logged in and which portal they are allowed to access.

### Frontend responsibilities

- Keep the current authenticated user information available to the app.
- Store the role returned by the backend: Student or Faculty/Admin.
- Load the current session when the page is refreshed.
- Show the correct portal after login.
- Provide a logout action.
- Handle expired sessions and unauthorized API responses.

### Important security approach

Prefer a secure, HTTP-only cookie session/token managed by the backend. React should not need to read a sensitive authentication token from JavaScript when the backend can manage it through cookies. The exact approach must match the backend authentication implementation.

Never place database credentials, AI provider keys, or Resend API keys in frontend environment variables. In Vite, variables with a `VITE_` prefix are exposed to browser-side code after the build, so only public configuration such as the API base URL belongs there.

### Completion check

- Refreshing a protected page should restore the session if it is still valid.
- Logging out should clear the frontend session and return the user to the correct login page.
- Students and faculty must not be able to navigate into each other's protected portal.

---

# PART B — PUBLIC WEBSITE

## 9. Feature 3: Public Landing Page

### Purpose

Introduce Smart Campus and explain how it reduces manual coordination for college event resources.

### Suggested sections

1. **Hero section**
   - Clear headline about simplifying campus event resource requests.
   - A short explanation of the AI-assisted request process.
   - Main action: Student Login / Get Started.
   - Secondary action: Faculty Login.
   - A relevant visual showing a campus event or an abstract view of the platform.

2. **Problem section**
   - Explain the current manual process: students contact faculty, ask about resource availability, and coordinate schedules.
   - Show the common difficulties: time, overlapping requests, and lack of tracking.

3. **How it works**
   - Student describes an event.
   - AI helps structure the requirements.
   - System checks resource availability.
   - Faculty reviews the request.
   - Student receives the decision.

4. **Platform capabilities**
   - Natural-language event requests.
   - Resource availability checking.
   - Request tracking.
   - Faculty request review.
   - Resource inventory management.

5. **Role entry section**
   - Student login/register link.
   - Faculty login link.

6. **Footer**
   - Platform name and short description.
   - Relevant navigation links.

### Interactions

- Main buttons navigate to the correct login or registration page.
- No public event booking or public resource editing should be available.
- The public site must not show private student requests or resource management data.

### Completion check

A first-time visitor should understand the problem, the solution, and which login path to use without needing a lengthy explanation.

---

# PART C — STUDENT PORTAL

## 10. Feature 4: Student Registration

### Purpose

Allow an eligible student to create an account using college identity details.

### Page fields

- Full name
- College email address
- Enrollment number
- Password
- Confirm password
- Accept terms checkbox, if required by the institution/project

### Frontend validation

- All required fields must be filled.
- Email must have a valid email format.
- Enrollment number must not be blank and should follow the college's agreed format, once that format is known.
- Password must meet the backend's password policy.
- Confirm password must match password.
- Disable the submit button while registration is processing.

### Submit flow

1. Student enters the required details.
2. Frontend validates the form.
3. Frontend sends the details to the student registration API.
4. Backend validates college identity and checks for duplicate email/enrollment number.
5. Frontend displays success or the exact validation error returned by the backend.
6. On success, guide the student to the login page or establish a session if that is the backend's chosen flow.

### Error cases to handle

- College email already registered.
- Enrollment number already registered.
- Invalid college email/domain, if the backend enforces a domain rule.
- Network/server error.
- Password rule not satisfied.

### Completion check

A student can register with valid information, receive useful error messages for invalid information, and cannot submit the same form multiple times while a request is in progress.

---

## 11. Feature 5: Student Login

### Purpose

Allow registered students to access the student portal.

### Page fields

- College email or the agreed student login identifier.
- Password.
- Show/hide password control.
- Login button.
- Link to Student Registration.
- Forgot password link only after the backend password-reset flow is planned and implemented.

### Login flow

1. Student enters credentials.
2. Frontend validates that both fields are present.
3. Frontend sends the credentials to the login API.
4. Backend verifies the student account and password.
5. Frontend stores the returned safe user/session state and routes the user to `/student`.

### Error cases

- Incorrect credentials.
- Account not found.
- Account disabled, if this rule exists in the backend.
- Server/network error.

### Completion check

Only a valid student session should open student routes. Do not provide a role selector that allows a user to self-assign the Faculty/Admin role.

---

## 12. Feature 6: Student Dashboard / Overview

### Purpose

Give the student a quick view of their event requests and a clear starting point for creating a new request.

### Suggested layout

1. Welcome area with the student's first name.
2. A prominent **Create Event Request** action.
3. Summary of the student's requests by the supported statuses:
   - Under Review
   - Approved
   - Rejected
4. Recent requests list.
5. A small guidance panel explaining how to describe an event in the chat.

### Recent request information

- Event title/name.
- Event date.
- Requested venue or key resource.
- Request creation date.
- Current request status.
- View details action.

### Interactions

- Clicking Create Event Request opens the AI request workspace.
- Clicking a recent request opens its detail page.
- Clicking a status summary filters or opens the request history view.

### Data source

All counts and recent request data must come from the backend. Do not use hardcoded dashboard numbers after API integration.

### Completion check

The student should be able to understand the state of their requests and begin a new one from the dashboard without searching through multiple pages.

---

## 13. Feature 7: AI Event Request Chat Workspace

### Purpose

This is the main student feature. It allows a student to explain an event in normal language instead of manually finding and filling a long list of resource fields.

### Suggested layout

- Page title and short instruction.
- Main chat conversation area.
- Student message bubbles.
- AI response bubbles.
- Typing/loading indicator while the backend processes a message.
- Message input area at the bottom.
- Send button.
- Optional example prompts to help a first-time user.
- A side panel or expandable summary showing the event details identified so far.

### Example student message

> I want to organize a technical session next Friday from 11 AM to 2 PM for around 80 students. I need a seminar hall, one projector, and two microphones.

### Chat interaction flow

1. Student opens Create Request.
2. The frontend creates or starts a conversation using the backend API.
3. Student types a normal-language event description.
4. Frontend sends the message and conversation identifier to the backend.
5. Backend runs the AI request-understanding process and returns an assistant response plus any structured details extracted so far.
6. Frontend displays the assistant response in the chat.
7. The structured event summary is updated as more details become available.
8. If essential information is missing or ambiguous, the AI response can ask a follow-up question. The student replies in the same chat.
9. Once the required information is complete, show the student a reviewable event summary.

### Event details the frontend should be prepared to display

- Event title or type.
- Event date.
- Start time and end time.
- Expected number of attendees.
- Venue/resource requirements.
- Quantity of each requested item.
- Additional notes supplied by the student.

### Chat behaviours

- Enter sends the message; Shift+Enter adds a new line.
- Prevent sending an empty message.
- Disable or guard the send action while the current message is being submitted, unless the chat API explicitly supports multiple in-flight messages.
- Keep the latest message visible by scrolling the conversation area appropriately.
- Clearly distinguish student messages from assistant messages.
- If the API fails, show a retry option without silently losing the student's typed message.
- On a page refresh, restore the conversation only if the backend provides conversation persistence/retrieval.

### Important frontend/backend boundary

The frontend does not call the AI provider directly. It sends the student's message to the Express backend. The backend protects the AI key, manages the prompt, validates the AI output, and returns data for the frontend to display.

### Completion check

A student can describe an event in plain text, receive an AI response, answer follow-up questions, and see a structured summary without manually refreshing the page.

---

## 14. Feature 8: Event Summary Review and Editing

### Purpose

Before checking availability, the student should be able to review what the system understood. This helps catch incorrect dates, times, attendee counts, or resource quantities.

### Summary fields

- Event name/type.
- Date.
- Start and end time.
- Number of attendees.
- Venue requirements.
- Equipment/resources and quantities.
- Additional notes.

### Interactions

- Display the extracted information in a clear summary panel.
- Provide an Edit action for fields the student is allowed to correct.
- Save edits through the expected backend endpoint or include them in the availability-check request.
- Provide a **Check Availability** action once the required details are present.
- If required details are still missing, keep the student in the chat flow and show the missing information in plain language.

### Completion check

The student can inspect and correct the structured information before it is used for availability checking. AI-extracted information must not be treated as automatically correct.

---

## 15. Feature 9: Resource Availability Results

### Purpose

Display the backend's availability result for the requested date, time, and resource quantities.

### When the student selects Check Availability

1. Frontend sends the reviewed event/resource data to the availability API.
2. Backend checks resource records and existing approved allocations.
3. Frontend displays the result returned by the backend.

### If requested resources are available

- Show a clear positive availability result.
- List the requested resources and quantities.
- Show the event date/time and attendee count.
- Provide the next action to send the request for Faculty/Admin review.
- Explain that availability does not mean final approval; Faculty/Admin must still review it.

### If one or more resources are unavailable

- Show which resource could not be accommodated.
- Show the requested quantity and available quantity when the backend supplies those values.
- Explain the date/time conflict when the backend provides conflict details.
- Provide an option to return to the summary/chat and modify the request.
- Allow the student to check availability again after making changes.

### Important rules

- Do not calculate final resource availability in React.
- Do not let the frontend invent alternative times or available quantities.
- The backend result is the source of truth.
- Availability labels such as Available or Unavailable describe resources; they are not request statuses.

### Completion check

The student sees an understandable result based on real backend data and can correct the request when a resource is unavailable.

---

## 16. Feature 10: Send Request for Faculty Review

### Purpose

Allow a student to send an availability-checked event request to Faculty/Admin.

### Before the action

Show a final review area containing:
- Event details.
- Date and time.
- Expected attendees.
- Resource list and quantities.
- Availability result.

### Submit flow

1. Student selects the action to send the request for review.
2. Frontend sends the final request data to the backend.
3. Backend validates the request again and creates the request record.
4. When creation succeeds, the frontend shows a confirmation and displays the request as **Under Review**.
5. The student can open the request details or go to request history.

### Important status rule

Do not display or save a separate `Submitted` status. The persisted request status after successful creation for faculty review is **Under Review**.

### Error cases

- Availability changed before the request was created.
- Required data is invalid or incomplete.
- The request could not be saved because of a network/server error.
- The backend reports that the resource is no longer available.

If the backend reports that availability has changed, return the student to the availability result and show the latest result.

### Completion check

A successful request is visible in the student's request history with the Under Review status. A failed API call must not display a false success message.

---

## 17. Feature 11: Student Request History

### Purpose

Give students one place to view all their event requests and see their current/final status.

### Page content

- Page title: My Requests.
- Request list/table.
- Status filter: Under Review, Approved, Rejected.
- Optional date filter or search by event name.
- Clear empty state when no requests exist.

### Suggested columns

- Event name.
- Event date.
- Submitted/created date (this is a date field, not a request status).
- Main requested resource.
- Status.
- View details action.

### Interactions

- Selecting a status filters the list.
- Selecting a request opens its detail page.
- Pagination or load-more can be added if the number of requests becomes large.

### Completion check

The page shows the student's own requests only, and status changes appear after the frontend refreshes the relevant backend data.

---

## 18. Feature 12: Student Request Details

### Purpose

Show one complete request and its latest status.

### Page content

- Request/event name.
- Date and time.
- Expected attendees.
- Requested resources with quantities.
- Request creation date.
- Current status: Under Review, Approved, or Rejected.
- Faculty decision information or remarks, if the backend provides them.
- A simple status timeline, if supported by the request data.

### Interactions

- Back to My Requests.
- Refresh/latest status through the backend.
- Display the decision clearly when approved or rejected.

Do not show a decision message that has not been returned by the backend. If faculty remarks are not part of the backend response, do not invent them in the UI.

---

## 19. Feature 13: Student Profile

### Purpose

Show the basic account information connected to the student's login.

### Information to display

- Student name.
- College email.
- Enrollment number.
- Role: Student.

Profile editing can be kept out of the first implementation unless the backend supports which fields are editable. Do not allow users to change their enrollment number or verified college identity through a frontend-only update.

---

# PART D — FACULTY/ADMIN PORTAL

## 20. Feature 14: Faculty/Admin Login Only

### Important account rule

Faculty/Admin accounts are created in advance in MongoDB by the project administrator. The frontend must not provide a Faculty/Admin registration or signup page.

### Page fields

- College email or Faculty ID.
- Password.
- Show/hide password control.
- Login button.

### Login flow

1. Faculty member opens `/faculty/login`.
2. Enters college email or Faculty ID and password.
3. Frontend validates that both fields are present.
4. Frontend sends credentials to the faculty login API.
5. Backend finds the pre-created faculty record and verifies the password.
6. On success, frontend routes to `/faculty`.
7. On failure, show a clear message without revealing whether a private account record exists beyond what the backend intentionally communicates.

### UI rules

- No signup link.
- No Create Faculty Account button.
- No public role registration.
- Do not offer faculty OTP signup unless it is added to the agreed backend requirements later.

### Completion check

Only a valid pre-created faculty account can open the Faculty/Admin portal.

---

## 21. Feature 15: Faculty/Admin Dashboard

### Purpose

Give faculty a quick view of resource usage and pending event requests.

### Main dashboard sections

1. Welcome header with faculty member's name.
2. Summary metrics:
   - Total resources.
   - Occupied/allocated resources.
   - Requests Under Review.
3. Recent requests requiring attention.
4. Resource overview or occupancy summary.
5. Quick links to Requests and Resources.

### Metric behaviour

- Metrics must be fetched from the backend.
- Clicking the Under Review count opens the request inbox with that status filter applied.
- Clicking resource totals opens the resource inventory.
- Do not hardcode numbers for presentation after API integration.

### Completion check

Faculty can quickly identify how many resources are recorded, how many are allocated, and which requests need review.

---

## 22. Feature 16: Faculty Request Inbox

### Purpose

Show the incoming requests that faculty/admin must review.

### Page layout

- Page header: Requests.
- Status filter: Under Review, Approved, Rejected.
- Search by event title or student name, if supported by the backend.
- Optional date filter.
- Requests presented in a structured table or list.

### Suggested request list information

- Event name/type.
- Student name and enrollment number, if available to the faculty role.
- Event date.
- Start/end time.
- Number of attendees.
- Requested venue/resources.
- Current status.
- View request action.

### Default view

Open the inbox on requests Under Review, because those are the requests that need a decision. Faculty can switch to Approved or Rejected to see previous decisions.

### Completion check

Faculty can identify a request quickly and open its full details without viewing unrelated student data.

---

## 23. Feature 17: Faculty Request Details

### Purpose

Give faculty all the information needed to make an informed decision.

### Page sections

1. **Event details** — event name/type, date, time, attendees, and description.
2. **Student details** — requesting student's relevant college details.
3. **Resource requirements** — each requested resource and quantity/capacity.
4. **Availability information** — the latest backend availability result.
5. **Conflict information** — other requests or existing allocations that overlap.
6. **Decision area** — Approve and Reject actions for a request that is Under Review.

### Approve action

1. Faculty selects Approve.
2. Frontend opens a confirmation dialog showing the event and resource summary.
3. Faculty confirms.
4. Frontend sends the approval action to the backend.
5. On success, show Approved and refresh the request list, dashboard metrics, and relevant resource data.

### Reject action

1. Faculty selects Reject.
2. Frontend asks for confirmation.
3. If the backend supports a rejection reason, show a reason field and validate it according to the backend rule.
4. Faculty confirms.
5. Frontend sends the rejection action to the backend.
6. On success, show Rejected and refresh relevant views.

### Rules

- Only requests with the Under Review status should show active approval/rejection controls.
- Approved and Rejected requests should be read-only in the normal workflow unless the backend later defines a change/reversal process.
- Disable action buttons during API submission to prevent accidental double actions.
- The backend must re-check conflicts before saving an approval. The frontend is not the final authority.

### Completion check

Faculty can open a request, understand its requirements, make a decision, and see the updated status after the backend confirms success.

---

## 24. Feature 18: Overlapping and Conflicting Requests

### Purpose

Help faculty identify when multiple students are requesting the same limited resource for overlapping time periods.

### What the frontend should display

When the backend identifies a conflict, show:
- The resource involved.
- Requested date and overlapping time range.
- Available quantity or capacity, if provided.
- Each competing request's event name.
- Requested quantity for each request.
- Current status of each request.
- Student/request details needed by the faculty member to compare them.

### Suggested UI presentation

Use a conflict panel or comparison view rather than hiding the conflict in a small warning icon.

For example, a conflict panel could compare:
- Request A: Seminar Hall, 10:00 AM–12:00 PM, 80 attendees.
- Request B: Seminar Hall, 11:00 AM–1:00 PM, 60 attendees.

The values above are only an illustration of the interface. Real values must come from the backend.

### Interaction flow

1. Faculty opens a request with a conflict indicator.
2. Frontend loads the conflict details from the backend.
3. Faculty reviews the competing requests.
4. Faculty opens the request they want to decide on.
5. Faculty approves or rejects through the normal decision process.
6. After a decision, frontend refreshes all affected request and resource data.

### Important rules

- Frontend must not decide which student deserves the resource.
- Frontend must not automatically approve one request and reject another.
- Conflict detection and final allocation are backend responsibilities.
- The backend must prevent two incompatible approved allocations, even if two faculty members act at nearly the same time.

### Completion check

Faculty can see why requests conflict and compare them, while the backend remains responsible for the final consistency check.

---

## 25. Feature 19: Resource Inventory

### Purpose

Allow faculty/admin to view the campus resources recorded in the system.

### Page content

- Page title: Resources.
- Total resource count.
- Resource list/table.
- Search by resource name.
- Filter by resource type.
- Resource quantity or capacity.
- Current allocated/occupied quantity, when supplied by the backend.
- Availability information, when supplied by the backend.
- Add Resource button.

### Resource examples

- Seminar hall.
- Classroom.
- Laboratory.
- Projector.
- Microphone.
- Other campus equipment.

### Resource modelling in the UI

The frontend must support two important resource patterns:

1. **Capacity-based resources** — for example, a seminar hall or classroom, where capacity is the important value.
2. **Quantity-based resources** — for example, microphones or projectors, where the system tracks a number of individual items.

The add form should change its fields based on the selected resource model.

### Completion check

Faculty can see the resources already stored in the system and understand their total quantity/capacity and allocation information.

---

## 26. Feature 20: Add Resource Form

### Purpose

Allow authorized faculty/admin users to add a campus resource to the database.

### Suggested form fields

- Resource name.
- Resource type/category.
- Resource model: Capacity-based or Quantity-based.
- Capacity, for a capacity-based resource.
- Total quantity, for a quantity-based resource.
- Description or notes.
- Any additional fields agreed during backend schema design.

### Conditional form behaviour

- If Capacity-based is selected, show a capacity field.
- If Quantity-based is selected, show a total quantity field.
- Do not ask for both values when only one is relevant.

### Validation

- Resource name is required.
- Resource type is required.
- Capacity or quantity must be a valid positive number, depending on the selected resource model.
- Description is optional unless the backend requires it.

### Submit flow

1. Faculty opens Add Resource.
2. Completes the form.
3. Frontend validates the values.
4. Frontend sends the resource data to the backend.
5. Backend validates and saves the resource.
6. Frontend shows success and refreshes the inventory and dashboard counts.

### Scope note

Adding resources is part of the confirmed initial scope. Editing, deleting, archiving, bulk import, and assigning resources to departments can be considered later if required. Do not silently add these as essential first-version features.

### Completion check

A resource can be added with the correct capacity/quantity model and appears in the inventory after the backend confirms it was saved.

---

## 27. Feature 21: Faculty Profile and Logout

### Profile information

- Faculty name.
- College email.
- Faculty ID.
- Role.

These details come from the pre-created faculty record returned by the backend.

### Logout

- Show a profile menu with Logout.
- Call the logout/session endpoint where applicable.
- Clear the client authentication state.
- Redirect to `/faculty/login`.

Do not provide faculty account creation or public editing of faculty identity fields.

---

# PART E — API INTEGRATION AND FRONTEND DATA FLOW

## 28. Suggested Frontend API Groups

The following endpoint names are proposed examples to help frontend and backend development stay aligned. They are not existing endpoints until implemented in the backend.

### Authentication APIs

| Method | Example endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/student/register` | Register a student. |
| POST | `/api/auth/student/login` | Log in a student. |
| POST | `/api/auth/faculty/login` | Log in a pre-created faculty account. |
| GET | `/api/auth/me` | Return the current authenticated user. |
| POST | `/api/auth/logout` | End the current session. |

### Student APIs

| Method | Example endpoint | Purpose |
|---|---|---|
| POST | `/api/ai/conversations` | Start an AI request conversation. |
| POST | `/api/ai/conversations/:id/messages` | Send a student message and receive the AI response/extracted data. |
| GET | `/api/ai/conversations/:id` | Restore a conversation, if persistence is implemented. |
| POST | `/api/requests/check-availability` | Check the latest resource availability for reviewed event details. |
| POST | `/api/requests` | Create a request for Faculty/Admin review. |
| GET | `/api/requests/my` | Get the logged-in student's request history. |
| GET | `/api/requests/:requestId` | Get one request owned by the logged-in student. |

### Faculty/Admin APIs

| Method | Example endpoint | Purpose |
|---|---|---|
| GET | `/api/faculty/dashboard` | Get faculty dashboard metrics. |
| GET | `/api/faculty/requests` | Get requests with filters. |
| GET | `/api/faculty/requests/:requestId` | Get request details. |
| GET | `/api/faculty/requests/:requestId/conflicts` | Get conflict details for a request. |
| PATCH | `/api/faculty/requests/:requestId/approve` | Approve a request. |
| PATCH | `/api/faculty/requests/:requestId/reject` | Reject a request. |
| GET | `/api/resources` | Get resource inventory. |
| POST | `/api/resources` | Add a resource. |

### API integration rules

- Create one Axios instance with the backend base URL and the correct cookie/credential configuration.
- Keep API functions in a separate `services/` folder; do not put raw Axios calls in every page component.
- Use TanStack Query for backend data fetching and mutations.
- After a successful approval, rejection, or resource addition, invalidate/refetch the affected queries.
- Display backend validation messages in the relevant form or page.
- Handle `401` (unauthenticated) and `403` (not allowed) consistently.
- The endpoint list and response shapes must be agreed with backend development before final integration.

---

## 29. Email and Resend: Frontend Responsibility

Resend is an email service used by the backend.

The frontend should:
- Show the updated request status after the backend confirms the decision.
- Optionally show a message that an email notification will be sent/has been triggered, only if the backend response supports that statement.
- Not ask the user for a Resend API key.
- Not import or call the Resend SDK.
- Not contain the Resend secret in `.env`, source code, or browser requests.

When faculty approves or rejects a request, the backend updates the request and triggers the email through Resend. The frontend only displays the result returned by the backend.

---

# PART F — FRONTEND PROJECT ORGANIZATION

## 30. Suggested Frontend Folder Structure

```text
frontend/
├── public/
│   ├── images/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── illustrations/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   └── ErrorState.jsx
│   │   ├── public/
│   │   │   ├── PublicNavbar.jsx
│   │   │   └── PublicFooter.jsx
│   │   ├── student/
│   │   │   ├── StudentNavbar.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ChatComposer.jsx
│   │   │   ├── EventSummary.jsx
│   │   │   ├── AvailabilityResult.jsx
│   │   │   └── RequestCard.jsx
│   │   └── faculty/
│   │       ├── FacultyNavbar.jsx
│   │       ├── RequestTable.jsx
│   │       ├── ConflictPanel.jsx
│   │       ├── ResourceTable.jsx
│   │       └── AddResourceForm.jsx
│   ├── layouts/
│   │   ├── PublicLayout.jsx
│   │   ├── StudentLayout.jsx
│   │   └── FacultyLayout.jsx
│   ├── pages/
│   │   ├── public/
│   │   │   └── LandingPage.jsx
│   │   ├── auth/
│   │   │   ├── StudentLogin.jsx
│   │   │   ├── StudentRegister.jsx
│   │   │   └── FacultyLogin.jsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── CreateRequest.jsx
│   │   │   ├── RequestHistory.jsx
│   │   │   ├── RequestDetails.jsx
│   │   │   └── StudentProfile.jsx
│   │   ├── faculty/
│   │   │   ├── FacultyDashboard.jsx
│   │   │   ├── FacultyRequests.jsx
│   │   │   ├── FacultyRequestDetails.jsx
│   │   │   ├── Resources.jsx
│   │   │   └── FacultyProfile.jsx
│   │   └── NotFound.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useDebounce.js
│   ├── services/
│   │   ├── apiClient.js
│   │   ├── authService.js
│   │   ├── studentService.js
│   │   ├── facultyService.js
│   │   └── resourceService.js
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── PublicRoute.jsx
│   │   ├── StudentRoute.jsx
│   │   └── FacultyRoute.jsx
│   ├── utils/
│   │   ├── dateFormat.js
│   │   └── errorMessage.js
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

This is a suggested structure, not a requirement to create every empty file at the beginning. Create folders and files when the related feature is implemented.

---

## 31. State Management Plan

Keep state management simple and give each type of data a clear owner.

### Authentication state — React Context

Keep only shared session information here, such as:
- Whether the user is logged in.
- Safe user profile details returned by the backend.
- User role.
- Loading state while checking the session.

### Backend/server data — TanStack Query

Use it for:
- Student request history and details.
- Faculty dashboard metrics.
- Faculty request lists and details.
- Resource inventory.
- Conflict information.

### Temporary page state — React state

Use normal component state for:
- Current text in the chat composer.
- Open/closed modal state.
- Selected filters.
- Temporary form edits.
- Currently selected tab.

Do not copy all backend data into Context or a separate global store. This creates duplicate state and makes it harder to keep screens in sync.

---

## 32. Loading, Empty, Error, and Success States

Every API-connected feature should be designed for more than the successful case.

| Situation | Required frontend behaviour |
|---|---|
| Initial loading | Show a skeleton or clear loading indicator. |
| Empty list | Explain that there are no requests/resources yet and show the next useful action. |
| API error | Show a readable error and retry action where appropriate. |
| Form validation error | Show the error beside the relevant field. |
| Successful save | Show confirmation and refresh relevant data. |
| Session expired | Return the user to the correct login page. |
| Access denied | Prevent access to the wrong role's page and show a clear message. |
| Double click | Disable or guard actions while the first API call is running. |

Do not show blank screens when an API returns an empty list or fails.

---

## 33. Accessibility and Usability Requirements

- Inputs must have visible labels.
- Buttons and links must have clear names.
- Do not use colour alone to communicate request status; include text such as Under Review, Approved, and Rejected.
- Ensure text and controls have sufficient contrast.
- All important controls should be usable with a keyboard.
- Modals should keep keyboard focus inside while open and return focus when closed.
- Use readable date/time formats and make the event timezone clear if the backend supports multiple timezones.
- Avoid very small text in tables and chat messages.

---

# PART G — IMPLEMENTATION ORDER

## 34. Recommended Development Phases

Build the frontend in the following order. Complete and test one phase before moving to the next.

### Phase 1: Frontend foundation

Build:
- React + Vite setup.
- Tailwind/custom CSS setup.
- Base typography, colours, spacing, and responsive rules.
- React Router setup.
- Shared Button, Input, Modal, StatusBadge, LoadingState, EmptyState, and ErrorState.

**Outcome:** The application structure and visual foundation are ready.

### Phase 2: Public pages and layouts

Build:
- Public landing page.
- Public navbar/footer.
- Student layout with horizontal navigation.
- Faculty layout with horizontal navigation.
- Responsive navigation behaviour.

**Outcome:** Public, student, and faculty shells are visually consistent and navigable.

### Phase 3: Authentication

Build:
- Student registration.
- Student login.
- Faculty login only.
- AuthContext and session restoration.
- Role-protected routes.
- Logout behaviour.

**Outcome:** Students and pre-created faculty users reach only their correct portals.

### Phase 4: Student portal overview and history

Build:
- Student dashboard.
- Request summary counts.
- Recent requests.
- Request history filters.
- Request details page.
- Student profile page.

**Outcome:** Students can see and track their requests. Use temporary mock data only until the API is ready, then replace it with real API data.

### Phase 5: AI event request experience

Build:
- Chat workspace UI.
- Message composer and message bubbles.
- Loading/typing states.
- Structured event summary.
- Summary edit interactions.
- Availability result display.
- Final send-for-review confirmation.

**Outcome:** The complete student request journey is implemented in the UI, ready to connect to the AI and request APIs.

### Phase 6: Faculty portal

Build:
- Faculty dashboard.
- Request inbox and filters.
- Request details.
- Approve/reject confirmation flows.
- Conflict comparison panel.
- Resource inventory.
- Add Resource form.
- Faculty profile.

**Outcome:** Faculty can view and manage requests and resources through the frontend.

### Phase 7: Backend API integration

Connect:
- Authentication pages to auth APIs.
- Student dashboard/history to request APIs.
- Chat workspace to the AI conversation APIs.
- Availability panel to resource availability API.
- Request submission to request API.
- Faculty dashboard and request inbox to faculty APIs.
- Approval/rejection to decision APIs.
- Resource inventory and add form to resource APIs.

**Outcome:** Replace mock data and simulated actions with actual backend behaviour.

### Phase 8: Testing and refinement

Test:
- All routes and role restrictions.
- Student registration and login.
- Faculty login with a pre-created account.
- AI chat follow-up interactions.
- Event summary editing.
- Availability responses for available and unavailable resources.
- Request creation and status display.
- Student request history.
- Faculty approval/rejection.
- Overlapping request visibility and refreshed data.
- Resource addition.
- Mobile/tablet layouts.
- Loading, empty, error, and success cases.

**Outcome:** The frontend is ready for demonstration and final integration.

---

## 35. Feature Completion Checklist

### Shared and public

- [ ] Public landing page is responsive.
- [ ] Shared components are reusable and consistent.
- [ ] Horizontal navigation works in both portals.
- [ ] Authentication state restores correctly after refresh.
- [ ] Student and faculty routes are protected by role.

### Student

- [ ] Student can register with college details.
- [ ] Student can log in and log out.
- [ ] Student dashboard shows real request counts and recent requests.
- [ ] Student can start an AI event request conversation.
- [ ] Student can send messages and respond to follow-up questions.
- [ ] Student can review and edit extracted event details.
- [ ] Student can check resource availability.
- [ ] Student can see unavailable resource details returned by the backend.
- [ ] Student can send an eligible request for faculty review.
- [ ] Successfully created requests appear as Under Review.
- [ ] Student can view request history and details.
- [ ] Student sees Approved and Rejected decisions after they are saved.

### Faculty/Admin

- [ ] There is no faculty signup page or signup link.
- [ ] A pre-created faculty member can log in.
- [ ] Faculty dashboard shows real resource and request metrics.
- [ ] Faculty can view and filter requests.
- [ ] Faculty can open complete request details.
- [ ] Faculty can see conflicting requests and resource information.
- [ ] Faculty can approve a request.
- [ ] Faculty can reject a request.
- [ ] Faculty can view resource inventory.
- [ ] Faculty can add a capacity-based resource.
- [ ] Faculty can add a quantity-based resource.

### Quality and security

- [ ] All API-connected pages have loading, empty, and error states.
- [ ] Repeated clicks cannot create duplicate actions.
- [ ] No AI or Resend secret is present in frontend code.
- [ ] No frontend-only status or availability decision is treated as authoritative.
- [ ] UI is usable on desktop, tablet, and mobile.

---

## 36. Features to Keep Outside the First Frontend Version

To keep the first version focused, do not add these unless the core workflow is complete and the project scope is intentionally expanded:

- Faculty signup or public faculty account creation.
- Student-to-student event sharing or social networking.
- Event ticket booking or public attendee registration.
- Payment gateway or paid event features.
- Automatic faculty approval by AI.
- Automatic conflict resolution by AI.
- Separate request statuses named Submitted or Needs Clarification.
- Advanced analytics beyond the basic resource/request overview.
- Calendar integrations and external scheduling integrations.
- Resource deletion, bulk imports, or advanced inventory operations unless required later.

---

## 37. Important Frontend/Backend Responsibilities

| Functionality | Frontend responsibility | Backend responsibility |
|---|---|---|
| Student registration | Collect and validate form input; show result. | Verify details, hash password, create account. |
| Student login | Send credentials; manage returned session state. | Verify credentials and issue/manage session. |
| Faculty login | Send email/Faculty ID and password. | Verify against pre-created faculty record. |
| AI chat | Display conversation and send messages. | Call AI provider, manage context, validate extracted data. |
| Event summary | Display and allow permitted corrections. | Validate and store accepted event data. |
| Availability | Display returned availability details. | Check resources, quantities, and time conflicts. |
| Request creation | Collect final confirmation and send request data. | Validate and create request with Under Review status. |
| Conflict display | Present competing requests clearly. | Detect conflicts and enforce allocation consistency. |
| Approve/reject | Ask for confirmation and display result. | Authorize faculty action, update status and allocation. |
| Email notification | Display updated request result. | Send email through Resend. |
| Resource addition | Collect and validate resource fields. | Validate permissions and save resource in MongoDB. |

This separation is essential. The browser is an interface; it must not become the authority for security, resource availability, AI decisions, or final approvals.

---

## 38. Official Documentation References

Use the official documentation while setting up the project and integrating each library:

- [React – Creating a React App](https://react.dev/learn/creating-a-react-app)
- [React – Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite – Features and React support](https://vite.dev/guide/features)
- [Vite – Environment variables and modes](https://vite.dev/guide/env-and-mode)
- [TanStack Query – React Quick Start](https://tanstack.com/query/latest/docs/framework/react/quick-start)

---

## 39. Final Frontend Outcome

When the frontend is complete, the application should provide two polished, role-specific portals:

### Student experience

A student can register, log in, describe an event through an AI chat, review the extracted event details, check resource availability, send an eligible request for faculty review, and track the request through Under Review, Approved, or Rejected.

### Faculty/Admin experience

A faculty member with a pre-created database account can log in, view resource and request summaries, inspect incoming requests, compare overlapping resource requests, approve or reject requests, and add campus resources.

The main goal is not simply to create dashboard pages. It is to make the entire event-resource request process understandable and usable from beginning to end, while keeping AI processing, availability checks, approval decisions, database operations, and Resend email delivery safely within the backend.
