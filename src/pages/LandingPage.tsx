import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Clock,
  ShieldCheck,
  Zap,
  QrCode,
  Sparkles,
  ArrowRight,
  ChefHat,
  Users,
  Store,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async (role: 'student' | 'vendor' | 'admin') => {
    let email = 'student@campuseats.edu';
    if (role === 'vendor') email = 'vendor1@campuseats.edu';
    if (role === 'admin') email = 'admin@campuseats.edu';

    const res = await login(email, 'Password123!');
    if (res.success) {
      if (role === 'student') navigate('/student');
      if (role === 'vendor') navigate('/vendor');
      if (role === 'admin') navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-slate-50 border-b border-slate-200/60 pt-12 pb-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-6 border border-orange-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Campus Food Ordering & Queue Management</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none max-w-4xl mx-auto">
              Order Ahead. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                Skip the Canteen Queue.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Campus Eats lets students order from multiple campus vendors in advance, pick a precise pickup time slot, pay securely online, and collect food instantly using a 4-digit PIN.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              {user ? (
                <Link
                  to={user.role === 'student' ? '/student' : user.role === 'vendor' ? '/vendor' : '/admin'}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-600 text-white font-bold text-base hover:bg-orange-700 transition shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2"
                >
                  Go to {user.role.toUpperCase()} Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register/student"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-600 text-white font-bold text-base hover:bg-orange-700 transition shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2"
                  >
                    Order Food Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    to="/register/vendor"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-base hover:bg-slate-50 transition shadow-2xs flex items-center justify-center gap-2"
                  >
                    Become a Vendor
                  </Link>
                </>
              )}
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="mt-12 pt-8 border-t border-slate-200/80 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
                ⚡ Instant Demo Login
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => handleDemoLogin('student')}
                  className="px-4 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold hover:bg-orange-100 transition flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  Student Demo
                </button>
                <button
                  onClick={() => handleDemoLogin('vendor')}
                  className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5"
                >
                  <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                  Vendor Demo
                </button>
                <button
                  onClick={() => handleDemoLogin('admin')}
                  className="px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Admin Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Steps */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Six-Step Express Food Pickup Flow
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Designed specifically to optimize kitchen preparation and eliminate student canteen wait times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg mb-4">
                  1
                </div>
                <h3 className="font-bold text-lg text-slate-900">Browse Campus Vendors</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Discover South Canteen, Brew & Bakes, Dragon Wok, and more. Filter by cuisine or prep time.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg mb-4">
                  2
                </div>
                <h3 className="font-bold text-lg text-slate-900">Choose Scheduled Slot</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Select a 15-minute pickup window (e.g. 12:30 PM – 12:45 PM). Capacity limits prevent kitchen congestion.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg mb-4">
                  3
                </div>
                <h3 className="font-bold text-lg text-slate-900">Pay Online & Get PIN</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Pay securely via Razorpay Test mode. Instant verification generates a cryptographically random 4-digit pickup PIN.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-lg mb-4">
                  4
                </div>
                <h3 className="font-bold text-lg text-slate-900">Kitchen Receives Live Order</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Vendor's kitchen dashboard updates in real time via Socket.IO. Staff accepts and starts cooking.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg mb-4">
                  5
                </div>
                <h3 className="font-bold text-lg text-slate-900">Real-Time Status Notifications</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Track progress without page refreshes: Placed → Accepted → Preparing → Ready for Pickup.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-lg mb-4">
                  6
                </div>
                <h3 className="font-bold text-lg text-slate-900">PIN Verification & Grab Food</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Arrive at vendor counter, show your 4-digit PIN. Staff verifies PIN on their dashboard and hands over food.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            <span>CAMPUS EATS © 2026</span>
          </div>
          <p>Built with React, Express, Socket.IO, MongoDB & Razorpay Test Mode.</p>
        </div>
      </footer>
    </div>
  );
};
