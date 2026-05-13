import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from './BottomNav';
import LiveChat from './LiveChat';
import { LogOut, User as UserIcon, Menu, X, Zap, ListOrdered, Wallet, MessageSquare, Shield, Bell, Settings, ShoppingCart, RefreshCw, Users, CreditCard } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [siteName, setSiteName] = useState('Natok Boost');
  const [pendingDepositsCount, setPendingDepositsCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSiteName(data.siteName || 'Natok Boost');
        if (data.tabTitle) document.title = data.tabTitle;
        if (data.faviconUrl) {
          const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = data.faviconUrl;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
      }
    });
    
    let unsubDeposits = () => {};
    if (userData?.role === 'admin') {
      const q = query(collection(db, 'transactions'), where('type', '==', 'deposit'), where('status', '==', 'pending'));
      unsubDeposits = onSnapshot(q, (snapshot) => {
        setPendingDepositsCount(snapshot.size);
      });
    }

    return () => {
      unsub();
      unsubDeposits();
    };
  }, [userData?.role]);

  const handleLogout = () => {
    signOut(auth);
  };

  const navLinks = [
    { to: '/dashboard', icon: Zap, label: 'Dashboard' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/new-order', icon: ShoppingCart, label: 'New Order' },
    { to: '/services', icon: ListOrdered, label: 'Services' },
    { to: '/orders', icon: ListOrdered, label: 'Orders' },
    { to: '/funds', icon: Wallet, label: 'Add Funds' },
    { to: '/child-panel', icon: Shield, label: 'Child Panel' },
    { to: '/updates', icon: RefreshCw, label: 'Updates' },
    { to: '/affiliates', icon: Users, label: 'Affiliates' },
    { to: '/api-docs', icon: Settings, label: 'API' },
    { to: '/tickets', icon: MessageSquare, label: 'Customer Care' },
    { to: '/mass-order', icon: ListOrdered, label: 'Mass Order' },
    { to: '/profile', icon: UserIcon, label: 'Account' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: Zap, label: 'User Dashboard' },
    { to: '/admin', icon: Shield, label: 'Admin View' },
    { to: '/admin/orders', icon: ListOrdered, label: 'Manage Orders' },
    { to: '/admin/services', icon: ListOrdered, label: 'Catalog' },
    { to: '/admin/users', icon: UserIcon, label: 'User List' },
    { to: '/admin/deposits', icon: CreditCard, label: 'Deposit Requests' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Live Support' },
    { to: '/admin/staff', icon: Shield, label: 'Staff & Roles' },
    { to: '/admin/settings', icon: Settings, label: 'Site Settings' },
  ];

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(true);

  const isHardcodedAdmin = user?.email?.toLowerCase() === 'shahinkhan28w@gmail.com' || 
                           user?.uid === 'wh4zeA8S61Rf4fQ8Im3vo7sW6d03';
  const isAdmin = userData?.role === 'admin' || isHardcodedAdmin;

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Live Chat Component */}
      {!isAdminRoute && <LiveChat />}

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[60] shadow-2xl flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Zap size={18} fill="currentColor" />
                </div>
                <span className="font-extrabold text-lg uppercase tracking-wider whitespace-nowrap">Natok Boost</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-1">
              {!isAdminRoute ? (
                <>
                  <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">User Menu</p>
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                          : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                        }
                      `}
                    >
                      <link.icon size={20} />
                      <span>{link.label}</span>
                    </NavLink>
                  ))}
                </>
              ) : (
                <>
                  <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Admin Control Center</p>
                  {adminLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) => `
                        flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all
                        ${isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon size={20} />
                        <span>{link.label}</span>
                      </div>
                      {link.to === '/admin/deposits' && pendingDepositsCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                          {pendingDepositsCount}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 space-y-4">
              {userData && (
                <div className="bg-blue-50 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Available Balance</p>
                  <p className="text-2xl font-black text-blue-700">${Number(userData.balance || 0).toFixed(2)}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Zap size={18} fill="currentColor" />
              </div>
              <span className="font-black text-xl tracking-tighter text-gray-900 uppercase">{siteName}</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors hidden sm:block">
              <Bell size={20} />
            </button>
            {userData && (
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-xl text-blue-700 font-black text-sm">
                ${Number(userData.balance || 0).toFixed(2)}
              </div>
            )}
            <NavLink to="/profile" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
              <UserIcon size={20} />
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Desktop Sidebar (Optional, for now just links in top nav or layout) */}
      
      <BottomNav />
    </div>
  );
}
