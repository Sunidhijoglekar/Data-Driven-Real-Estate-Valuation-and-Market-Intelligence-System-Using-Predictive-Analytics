import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, ShieldCheck, LogIn } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Properties', path: '/properties' },
    { label: 'Market Analytics', path: '/ml-analytics' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'Buyer') return '/buyer';
    if (user.role === 'Seller') return '/seller';
    if (user.role === 'Investor') return '/investor';
    return '/login';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                Real<span className="text-blue-600"> Estate</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Real Estate Platform
              </span>
            </div>
          </Link>

          {/* Public Navigation Links (Home, Properties, About, Contact) */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    active
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Button: Dashboard if logged in, or Login */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={getDashboardRoute()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Go to {user.role} Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  location.pathname === '/login'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
