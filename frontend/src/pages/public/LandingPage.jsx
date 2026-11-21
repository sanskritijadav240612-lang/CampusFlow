import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Bot, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';

export const LandingPage = () => {
  return (
    <div className="bg-surface-base">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-surface-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-campus-50 border border-campus-200 text-campus-800 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-campus-600 animate-pulse" />
              Smart Campus Operations Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Campus Event Coordination,{' '}
              <span className="text-campus-700">Intelligently Orchestrated.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              CampusFlow replaces paper forms and email chains with conversational AI drafting,
              real-time resource availability checks, and institutional approval workflows.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" variant="primary" rightIcon={ArrowRight}>
                  Student Registration
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Student Sign In
                </Button>
              </Link>
              <Link to="/faculty/login">
                <Button size="lg" variant="ghost">
                  Faculty Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Engineered for Campus Efficiency
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            A cohesive architecture connecting student organizers with faculty administrators.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
            <div className="w-10 h-10 rounded-md bg-campus-50 text-campus-700 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Conversational AI Coordinator</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Students articulate event ideas naturally. The assistant extracts schedules, attendee numbers,
              and equipment needs without rigid forms.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
            <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Deterministic Availability</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Venues and equipment inventories are verified in real time against approved allocations
              using high-precision interval mathematics.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-surface-border shadow-soft">
            <div className="w-10 h-10 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Atomic Faculty Decisions</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Faculty review requests with automatic conflict highlighting, atomic MongoDB approvals,
              and instant email confirmations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
