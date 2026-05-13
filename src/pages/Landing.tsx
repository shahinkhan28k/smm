import React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Zap, Shield, Smartphone, ArrowRight, BarChart3, Users } from 'lucide-react';

export default function Landing() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900 uppercase">Natok Boost</span>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <NavLink to="/dashboard" className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-full shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                Dashboard
              </NavLink>
            ) : (
              <>
                <NavLink to="/login" className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">
                  Log In
                </NavLink>
                <NavLink to="/login" className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-full shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              #1 SMM Panel in Asia
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
              Boost Your Social Presence <span className="text-blue-600">Instantly</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Experience the fastest and most reliable social media growth services. 
              Real followers, likes, and views delivered in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavLink to={user ? "/dashboard" : "/login"} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                {user ? "Go to Dashboard" : "Start Boosting Now"} <ArrowRight size={20} />
              </NavLink>
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Shield size={16} className="text-green-500" /> Secure Payments
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Proof */}
      <section className="py-12 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <h3 className="text-3xl font-black text-gray-900">50K+</h3>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Happy Users</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-black text-gray-900">1M+</h3>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Orders Completed</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-black text-gray-900">24/7</h3>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Expert Support</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-black text-gray-900">0.01s</h3>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">API Speed</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Natok Boost?</h2>
            <div className="w-12 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our automated system processes orders immediately. No waiting, no delays. Your growth starts the moment you click.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your account safety is our priority. We nunca ask for passwords. All services are compliant with platform guidelines.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Optimized</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Managed your orders on the go. Our panel is built for mobile users first, providing a smooth app-like experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-blue-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <h2 className="text-4xl font-black mb-6 leading-tight">Everything You Need <br/> For Social Dominance</h2>
              <ul className="space-y-4">
                {[
                  'Instagram Followers, Likes & Views',
                  'Facebook Page Likes & Post Reactions',
                  'YouTube Watch Time & Subscribers',
                  'TikTok Viral Growth Services',
                  'Twitter/X Engagement Packs'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="w-1/2 h-2 bg-white/20 rounded-full"></div>
                  <div className="w-3/4 h-2 bg-white/10 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
                <div className="h-12 bg-blue-600 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] -mr-48 -mt-48 opacity-20"></div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold italic text-xs">NB</span>
            </div>
            <span className="font-bold text-gray-900">Natok Boost</span>
          </div>
          <p className="text-gray-400 text-xs">
            © 2026 Natok Boost. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
