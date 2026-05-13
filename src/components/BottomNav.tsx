import { NavLink, useLocation } from 'react-router-dom';
import { Home, ListOrdered, Wallet, MessageSquare, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) return null;

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/orders', icon: ListOrdered, label: 'Orders' },
    { to: '/funds', icon: Wallet, label: 'Wallet' },
    { to: '/tickets', icon: MessageSquare, label: 'Tickets' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50 md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            )
          }
        >
          <item.icon size={20} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
