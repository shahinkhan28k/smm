import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { NavLink } from 'react-router-dom';

export default function Profile() {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!user) return null;

  const displayName = userData?.displayName || user.displayName || 'User';
  const email = userData?.email || user.email || '';

  const isHardcodedAdmin = user?.email?.toLowerCase() === 'shahinkhan28w@gmail.com' || 
                           user?.uid === 'wh4zeA8S61Rf4fQ8Im3vo7sW6d03';
  const isAdmin = userData?.role === 'admin' || isHardcodedAdmin;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Banner/Header */}
        <div className="h-32 bg-blue-600 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,#ffffff_1%,transparent_20%)]"></div>
        </div>
        <div className="px-6 pb-8 -mt-16 relative">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-[40px] p-1.5 shadow-xl">
              <div className="w-full h-full bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600 font-black text-4xl uppercase">
                {displayName.charAt(0)}
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-black text-gray-900 tracking-tight">{displayName}</h1>
            <div className="mt-2 flex items-center gap-2">
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                {isAdmin ? 'admin' : (userData?.role || 'user')}
              </div>
              {isAdmin && (
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Verified Staff</span>
              )}
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="p-3 bg-white rounded-2xl text-gray-400 shadow-sm">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Primary Email</p>
                <p className="text-base font-bold text-gray-800">{email}</p>
              </div>
            </div>

            {isAdmin && (
              <NavLink 
                to="/admin" 
                className="flex items-center gap-4 p-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 border-4 border-white"
              >
                <div className="p-3 bg-white/20 rounded-2xl text-white backdrop-blur-md">
                  <LayoutDashboard size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-0.5">System Access</p>
                  <p className="text-base font-black uppercase tracking-tighter">Launch Admin Control Panel</p>
                </div>
                <Shield size={20} className="opacity-50" />
              </NavLink>
            )}

            <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="p-3 bg-white rounded-2xl text-gray-400 shadow-sm">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Account ID</p>
                <p className="text-sm font-mono font-bold text-gray-500">{user.uid}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="p-3 bg-white rounded-2xl text-gray-400 shadow-sm">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Wallet Balance</p>
                <p className="text-xl font-black text-blue-600">${userData?.balance?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => signOut(auth)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all active:scale-95"
            >
              <LogOut size={18} />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
        Natok Boost Security Check v1.0
      </p>
    </div>
  );
}
