import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
  Bot,
  Sliders,
  AlertTriangle,
  Building,
  Mic,
  Users,
  FileCheck2,
  Bell,
  Cpu,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';

export const LandingPage = () => {
  return (
    <div className="bg-surface-base text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-surface-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-campus-50 border border-campus-200/80 text-campus-800 text-xs font-semibold mb-6 shadow-soft">
              <span className="w-2 h-2 rounded-full bg-campus-600 animate-pulse" />
              Intelligent Campus Event Operations
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Campus Event Coordination,{' '}
              <span className="text-campus-700 block sm:inline">Intelligently Orchestrated.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              CampusFlow unifies student event planning and faculty administrative approvals into one
              deterministic operations platform. Eliminate double-bookings, manual spreadsheets, and lost paperwork.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" variant="primary" rightIcon={ArrowRight}>
                  Get Started as Student
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline">
                  How It Works
                </Button>
              </a>
              <Link to="/faculty/login">
                <Button size="lg" variant="ghost">
                  Faculty Access &rarr;
                </Button>
              </Link>
            </div>
          </div>

          {/* CUSTOM PLATFORM COMPOSITION PREVIEW */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-xl p-3 sm:p-5 shadow-modal border border-slate-800">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-slate-300">
                    campusflow.internal/operations/preview
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                  <span>MongoDB Replica Engine: Healthy</span>
                </div>
              </div>

              {/* Composition Grid: 3 Interactive Facets */}
              <div className="grid lg:grid-cols-12 gap-4">
                {/* 1. Conversational AI Coordinator */}
                <div className="lg:col-span-4 bg-slate-950 rounded-lg p-4 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-campus-400" />
                        AI Event Assistant
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-campus-900/50 text-campus-300 border border-campus-700/50">
                        Live Parsing
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="bg-slate-900 text-slate-300 p-2.5 rounded-md border border-slate-800">
                        <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Student:</p>
                        "We need the Main Auditorium next Friday 2 PM for our annual Hackathon. Expecting 250 attendees and 4 wireless mics."
                      </div>
                      <div className="bg-campus-950/60 text-campus-200 p-2.5 rounded-md border border-campus-800/40">
                        <p className="text-[11px] font-semibold text-campus-400 mb-0.5">Assistant:</p>
                        "Understood! Extracted Main Auditorium (Capacity: 300) and 4 Wireless Mics. Verifying calendar conflicts against campus registry..."
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Draft Completeness:</span>
                    <span className="text-emerald-400 font-semibold font-mono">100% Ready for Review</span>
                  </div>
                </div>

                {/* 2. Deterministic Availability Engine */}
                <div className="lg:col-span-4 bg-slate-950 rounded-lg p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      Temporal Availability
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">
                      0 Overlaps
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">Main Auditorium</p>
                        <p className="text-[11px] text-slate-400">Capacity: 300 &bull; Requested: 250</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                        Available
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">Wireless Mics (Quantity)</p>
                        <p className="text-[11px] text-slate-400">Inventory: 10 &bull; Requested: 4</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                        6 Units Free
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Sweep Interval:</span> Nov 27, 14:00 - 18:00
                    </div>
                  </div>
                </div>

                {/* 3. Faculty Decision & Atomic Allocation */}
                <div className="lg:col-span-4 bg-slate-950 rounded-lg p-4 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-sky-400" />
                        Faculty Review Matrix
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-700/40">
                        Dean Verified
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Decision Status:</span>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                          Approved
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-snug">
                        <span className="text-slate-500 block">Faculty Remark:</span>
                        "Approved. Custodial team notified for stage setup. Enjoy the Hackathon."
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-campus-400" /> Email Dispatched
                    </span>
                    <span className="text-slate-300 font-mono">Resend ID: #msg_9941</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section id="problem" className="py-20 bg-surface-base border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-2">
              The Campus Bottleneck
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Why Traditional Campus Event Coordination Fails
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Universities handle hundreds of club activities every semester. When relying on manual paper forms and unlinked spreadsheets, operational breakdowns become inevitable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
              <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-semibold text-slate-900">Scattered Communications</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Requests get buried in forwarded faculty emails, messaging groups, and physical printed slips, resulting in lost submissions and miscommunication.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
              <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-semibold text-slate-900">Venue Double-Bookings</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Without synchronized calendar verification, two student associations often find themselves booked for the same auditorium simultaneously.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
              <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-semibold text-slate-900">Equipment Stockout Confusion</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Projectors, wireless microphones, and stage audio are committed on paper without real-time tracking of total inventory limits.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
              <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm mb-4">
                04
              </div>
              <h3 className="text-base font-semibold text-slate-900">Unresolved Competing Requests</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Faculty administrators have no clear side-by-side conflict matrix when two student clubs request the same seminar hall on the same afternoon.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
              <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm mb-4">
                05
              </div>
              <h3 className="text-base font-semibold text-slate-900">Zero Student Status Visibility</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Student organizers are left in the dark for weeks, unable to announce guest speakers or start ticketing because approval statuses remain unknown.
              </p>
            </div>

            <div className="bg-campus-900 text-white p-6 rounded-lg flex flex-col justify-between shadow-soft">
              <div>
                <span className="text-xs font-semibold text-campus-300 uppercase tracking-wider block mb-2">
                  The CampusFlow Solution
                </span>
                <h3 className="text-lg font-bold">One Single Source of Truth</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Real-time database allocations, deterministic conflict checking, and conversational AI drafting streamline the entire institutional lifecycle.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-campus-800 text-xs text-campus-200">
                &bull; Built exclusively for university campuses.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM FEATURES */}
      <section id="features" className="py-20 bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-700 block mb-2">
              Platform Features
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Complete Operations Infrastructure
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered with institutional rigor to satisfy faculty administrators and student clubs alike.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-campus-50 text-campus-700 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Conversational AI Intake</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students state their needs in plain English. The AI parses event titles, dates, attendee estimates, and equipment requests into strict structured schemas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Sweep-Line Availability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Temporal discrete sweep-line algorithms evaluate overlapping time intervals to calculate exact remaining equipment quantities at any given second.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Dual Resource Architecture</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Native separation between capacity-governed venues (auditoriums, labs) and discrete inventory-governed equipment (microphones, podiums).
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Atomic MongoDB Approvals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Faculty approval locks resource versions and commits all allocations atomically. Partial reservations or race conditions are physically impossible.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Resend Email Integration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Immediate, responsive HTML email dispatches keep students updated on approvals and rejections with faculty remarks, complete with automated deduplication.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Tamper-Proof Audit Trails</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every faculty approval, rejection, and inventory addition is permanently indexed in MongoDB audit collections for complete compliance reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS WORKFLOW */}
      <section id="how-it-works" className="py-20 bg-surface-base border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-700 block mb-2">
              Operational Workflow
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              From Concept to Confirmed Booking
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A transparent 5-step lifecycle ensuring seamless collaboration between students and university staff.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-lg border border-surface-border shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-campus-700 block mb-2">01</span>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Natural Intake</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Student describes their planned workshop or cultural event in the AI chat.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Step 1: Student
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-surface-border shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-campus-700 block mb-2">02</span>
                <h4 className="text-sm font-bold text-slate-900 mb-1">AI Structuring</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Model normalizes dates, timezones, and resolves mentions against active catalog items.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Step 2: AI Parser
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-surface-border shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-campus-700 block mb-2">03</span>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Real-Time Check</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Backend executes mathematical interval verification against active allocations.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Step 3: Availability
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-surface-border shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-campus-700 block mb-2">04</span>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Faculty Review</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Faculty coordinator reviews the request alongside any competing claims.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Step 4: Administration
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-surface-border shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-2xl font-black text-campus-700 block mb-2">05</span>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Atomic Lock</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Resources are locked, reservation confirmed, and confirmation email sent.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Step 5: Confirmation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEPARATE EXPERIENCES (STUDENT VS FACULTY) */}
      <section className="py-20 bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-700 block mb-2">
              Role-Specific Portals
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Tailored Experiences for Every Stakeholder
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Student Experience */}
            <div className="bg-surface-base rounded-xl p-8 border border-surface-border shadow-soft flex flex-col justify-between">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-campus-100 text-campus-800 mb-4">
                  For Student Organizers
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Student Portal</h3>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Effortless event proposal authoring without administrative hurdles.
                </p>

                <ul className="space-y-3 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                    Conversational AI event drafting assistant
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                    Immediate availability checks before submission
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                    Live request tracking across "Under Review", "Approved", and "Rejected"
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                    Institutional email confirmations with assigned venue instructions
                  </li>
                </ul>
              </div>

              <Link to="/register">
                <Button variant="primary" className="w-full">
                  Register as Student Organiser
                </Button>
              </Link>
            </div>

            {/* Faculty Experience */}
            <div className="bg-slate-900 text-white rounded-xl p-8 shadow-soft flex flex-col justify-between">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 mb-4">
                  For University Staff
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Faculty & Administrative Portal</h3>
                <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                  Comprehensive authority and oversight over campus physical assets.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-400 shrink-0" />
                    Conflict detection matrix highlighting overlapping resource claims
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-400 shrink-0" />
                    Atomic one-click approval with concurrency version guards
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-400 shrink-0" />
                    Complete campus resource inventory management (venues & equipment)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-campus-400 shrink-0" />
                    Automated audit logging and notification retry handling
                  </li>
                </ul>
              </div>

              <Link to="/faculty/login">
                <Button variant="outline" className="w-full bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                  Access Faculty Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RESOURCE MANAGEMENT SHOWCASE */}
      <section id="resources" className="py-20 bg-surface-base border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-700 block mb-2">
              Asset Governance
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Campus Resource Inventory Showcase
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              CampusFlow supports university venues and equipment through specialized mathematical invariants.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-campus-50 text-campus-700 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Capacity-Based Venues</h4>
                    <span className="text-[11px] text-slate-500">Auditoriums, Labs, Seminar Halls</span>
                  </div>
                </div>
                <span className="text-xs font-mono bg-campus-50 text-campus-800 px-2 py-0.5 rounded border border-campus-200">
                  Single Active Allocation
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Venues accept events only if the estimated attendee count does not exceed the facility's max seating capacity, and automatically block any overlapping schedule.
              </p>
              <div className="bg-slate-50 p-3 rounded text-[11px] text-slate-600 font-mono">
                Example: Main Auditorium &bull; Capacity 500 Seats &bull; Mutual Exclusivity Enforced
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-sky-50 text-sky-700 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Quantity-Tracked Equipment</h4>
                    <span className="text-[11px] text-slate-500">Microphones, Projectors, Speakers</span>
                  </div>
                </div>
                <span className="text-xs font-mono bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                  Discrete Inventory Swarm
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Equipment can be shared across multiple concurrent events up to the total physical inventory limit, tracked using interval delta calculations.
              </p>
              <div className="bg-slate-50 p-3 rounded text-[11px] text-slate-600 font-mono">
                Example: Wireless Microphones &bull; Total Units: 12 &bull; Max Concurrent Sum &le; 12
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Modernize Your Campus Event Workflow?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join students and faculty across departments using CampusFlow for seamless reservation management.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" variant="primary" rightIcon={ArrowRight}>
                Register Student Account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
