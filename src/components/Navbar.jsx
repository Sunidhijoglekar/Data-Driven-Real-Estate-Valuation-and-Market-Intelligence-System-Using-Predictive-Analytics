import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, TrendingUp, UserCheck, LogOut, ShieldCheck, Cpu, Gavel, FolderKanban, Bell, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiService.getNotifications(user.email);
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch {
      // Silently ignore transient polling network blips
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await apiService.markAllNotificationsRead(user.email);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'Buyer') return '/buyer';
    if (user.role === 'Seller') return '/seller';
    if (user.role === 'Investor') return '/investor';
    return '/login';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                RealEstate<span className="text-blue-600">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                Market Intelligence System
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                location.pathname === '/'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/buyer"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                location.pathname === '/buyer'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Properties
            </Link>

            <Link
              to="/auctions"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                location.pathname === '/auctions'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'text-amber-800 hover:text-amber-900 hover:bg-amber-100/60'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              Live Auctions
            </Link>

            <Link
              to="/ml-analytics"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                location.pathname === '/ml-analytics'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              AI Prediction
            </Link>

            <Link
              to="/ml-analytics"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                location.pathname === '/ml-analytics'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Market Analytics
            </Link>
          </nav>

          {/* User Profile, Notifications & Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 relative">
                
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 relative cursor-pointer"
                    title="Live Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {showNotifPanel && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-heading font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-blue-600" />
                          Auction Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Mark All Read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6">No notifications yet.</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                                notif.read ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-blue-50/70 border-blue-200 text-slate-900 font-medium'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                  {notif.type === 'OUTBID' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                  {notif.type === 'AUCTION_WON' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                  {notif.type === 'BID_PLACED' && <Gavel className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                  {notif.title}
                                </span>
                                <span className="text-[9px] text-slate-400 shrink-0">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-800">{user.name}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    user.role === 'Buyer' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    user.role === 'Seller' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    <UserCheck className="w-3 h-3" />
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Portal Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
