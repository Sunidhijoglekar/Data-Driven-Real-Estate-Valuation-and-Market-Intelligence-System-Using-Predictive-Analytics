import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Search, Cpu, Bookmark, Gavel, FolderKanban,
  History, Bell, User, LogOut, ShieldCheck, Plus, Settings, DollarSign,
  TrendingUp, PieChart, LineChart, FileText, CheckCircle2, AlertTriangle,
  Menu, X, Sparkles, UserCheck, Flame, Ticket, ChevronRight, Clock
} from 'lucide-react';
import { apiService } from '../services/api';

export default function DashboardLayout({ user, onLogout, activeTab, onTabChange, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const role = user?.role || 'Buyer';

  const loadNotifications = async () => {
    if (!user?.email) return;
    try {
      const res = await apiService.getNotifications(user.email);
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user?.email) return;
    try {
      await apiService.markAllNotificationsRead(user.email);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Define role-specific sidebar menus with professional business labels
  const getRoleMenuItems = () => {
    if (role === 'Buyer') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/buyer' },
        { id: 'search', label: 'Search Properties', icon: Search, route: '/buyer?tab=search' },
        { id: 'prediction', label: 'Property Valuation', icon: Cpu, route: '/buyer?tab=prediction' },
        { id: 'saved', label: 'Saved Properties', icon: Bookmark, route: '/buyer?tab=saved' },
        { id: 'auctions', label: 'Live Auctions', icon: Gavel, route: '/auctions', isDirectRoute: true },
        { id: 'my-auctions', label: 'My Auctions', icon: FolderKanban, route: '/my-auctions', isDirectRoute: true },
        { id: 'history', label: 'Valuation History', icon: History, route: '/buyer?tab=history' },
        { id: 'notifications', label: 'Notifications', icon: Bell, route: '/buyer?tab=notifications' },
        { id: 'profile', label: 'Profile', icon: User, route: '/buyer?tab=profile' },
      ];
    }

    if (role === 'Seller') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/seller' },
        { id: 'my-properties', label: 'My Properties', icon: Building2, route: '/seller?tab=my-properties' },
        { id: 'add-property', label: 'Add Property', icon: Plus, route: '/seller?tab=add-property' },
        { id: 'manage-properties', label: 'Manage Properties', icon: Settings, route: '/seller?tab=manage-properties' },
        { id: 'create-auction', label: 'Create Auction', icon: Gavel, route: '/seller?tab=create-auction' },
        { id: 'auction-management', label: 'Auction Management', icon: ShieldCheck, route: '/seller?tab=auction-management' },
        { id: 'sold-properties', label: 'Sold Properties', icon: DollarSign, route: '/seller?tab=sold-properties' },
        { id: 'analytics', label: 'Market Analytics', icon: TrendingUp, route: '/seller?tab=analytics' },
        { id: 'notifications', label: 'Notifications', icon: Bell, route: '/seller?tab=notifications' },
        { id: 'profile', label: 'Profile', icon: User, route: '/seller?tab=profile' },
      ];
    }

    if (role === 'Investor') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/investor' },
        { id: 'analytics', label: 'Market Analytics', icon: PieChart, route: '/investor?tab=analytics' },
        { id: 'forecast', label: 'Future Price Forecast', icon: LineChart, route: '/investor?tab=forecast' },
        { id: 'roi', label: 'ROI Analysis', icon: DollarSign, route: '/investor?tab=roi' },
        { id: 'ai-reports', label: 'Reports', icon: FileText, route: '/investor?tab=ai-reports' },
        { id: 'saved-reports', label: 'Saved Reports', icon: Bookmark, route: '/investor?tab=saved-reports' },
        { id: 'notifications', label: 'Notifications', icon: Bell, route: '/investor?tab=notifications' },
        { id: 'profile', label: 'Profile', icon: User, route: '/investor?tab=profile' },
      ];
    }

    return [];
  };

  const menuItems = getRoleMenuItems();

  const handleMenuClick = (item) => {
    setSidebarOpen(false);
    if (item.isDirectRoute) {
      navigate(item.route);
    } else if (onTabChange) {
      onTabChange(item.id);
    } else {
      const targetRolePath = role === 'Buyer' ? '/buyer' : role === 'Seller' ? '/seller' : '/investor';
      navigate(`${targetRolePath}?tab=${item.id}`);
    }
  };

  const isItemActive = (item) => {
    if (item.isDirectRoute) {
      return location.pathname === item.route;
    }
    return activeTab === item.id;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Mobile Menu Toggle + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                title="Toggle Menu"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link to={role === 'Buyer' ? '/buyer' : role === 'Seller' ? '/seller' : '/investor'} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-heading font-bold text-base text-slate-900 tracking-tight block leading-tight">
                    Apex<span className="text-blue-600">Realty</span>
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                    {role} Command Center
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: Notifications, Profile & Logout */}
            <div className="flex items-center gap-3">
              
              {/* Role Badge */}
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border ${
                role === 'Buyer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                role === 'Seller' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                <UserCheck className="w-3.5 h-3.5" />
                {role}
              </span>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifPanel(!showNotifPanel)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {showNotifPanel && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-heading font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        Notifications
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
                            className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                              notif.read ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-blue-50/70 border-blue-200 text-slate-900 font-medium'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                {notif.type === 'AUCTION_CREATED' && <Gavel className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                {notif.type === 'REGISTRATION_REQUESTED' && <Ticket className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                {notif.type === 'REGISTRATION_APPROVED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                {notif.type === 'REGISTRATION_PENDING' && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                {notif.type === 'OUTBID' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                {notif.type === 'AUCTION_WON' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                {notif.type === 'BID_PLACED' && <Gavel className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                {notif.title}
                              </span>
                              <span className="text-[9px] text-slate-400 shrink-0">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>
                            
                            {/* Action Buttons based on notification type */}
                            {notif.type === 'AUCTION_CREATED' && (
                              <button
                                onClick={() => {
                                  setShowNotifPanel(false);
                                  navigate(`/join-auction/${notif.property_id || notif.auction_id}`);
                                }}
                                className="mt-1 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Ticket className="w-3 h-3" />
                                Request Access to Bid
                              </button>
                            )}

                            {notif.type === 'REGISTRATION_REQUESTED' && (
                              <button
                                onClick={() => {
                                  setShowNotifPanel(false);
                                  if (onTabChange) onTabChange('auction-management');
                                  navigate('/seller');
                                }}
                                className="mt-1 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                Review & Approve Request
                              </button>
                            )}

                            {notif.type === 'REGISTRATION_APPROVED' && (
                              <button
                                onClick={() => {
                                  setShowNotifPanel(false);
                                  navigate(`/auction/${notif.property_id || notif.auction_id}/live`);
                                }}
                                className="mt-1 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Gavel className="w-3 h-3" />
                                Enter Live Auction Room
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Button */}
              <button
                onClick={() => handleMenuClick({ id: 'profile' })}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                title="View Profile"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span className="max-w-[100px] truncate">{user?.name || role}</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-bold text-slate-700">Logout</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* BODY WITH LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* LEFT SIDEBAR (Desktop permanent, Mobile drawer) */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r lg:border border-slate-200 lg:rounded-3xl p-4 flex flex-col justify-between shadow-lg lg:shadow-xs transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="space-y-6">
            
            {/* Sidebar User Info Header */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                role === 'Buyer' ? 'bg-blue-600' :
                role === 'Seller' ? 'bg-emerald-600' :
                'bg-purple-600'
              }`}>
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-900 text-xs truncate block">{user?.name || 'User'}</span>
                <span className="text-[10px] text-slate-500 truncate block">{user?.email || ''}</span>
              </div>
            </div>

            {/* Menu Items List */}
            <nav className="space-y-1">
              <span className="px-3 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-2">
                {role} Navigation
              </span>

              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      active
                        ? role === 'Buyer'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : role === 'Seller'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

          </div>

          {/* Bottom Sidebar Footer */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 hover:border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 min-w-0 space-y-6">
          {children}
        </main>

      </div>

    </div>
  );
}
