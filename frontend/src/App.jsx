import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { apiService } from './services/api';
import { sessionStore } from './services/session';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import PublicProperties from './pages/PublicProperties';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import PropertyDetail from './pages/PropertyDetail';
import PropertyValuation from './pages/PropertyValuation';
import MLAnalytics from './pages/MLAnalytics';
import JoinAuction from './pages/JoinAuction';
import LiveAuction from './pages/LiveAuction';
import AuctionWinner from './pages/AuctionWinner';
import LiveAuctionsDashboard from './pages/LiveAuctionsDashboard';
import MyAuctions from './pages/MyAuctions';

function MainLayout({ user, onLogout, handleLoginSuccess }) {
  const location = useLocation();
  const isDashboardRoute = ['/buyer', '/seller', '/investor'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div>
        {/* Render public Navbar only for public pages */}
        {!isDashboardRoute && <Navbar user={user} onLogout={onLogout} />}

        <main>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home user={user} />} />
            <Route path="/properties" element={<PublicProperties user={user} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={user.role === 'Buyer' ? '/buyer' : user.role === 'Seller' ? '/seller' : '/investor'} replace />
                ) : (
                  <Login onLoginSuccess={handleLoginSuccess} />
                )
              }
            />
            <Route path="/property/:id" element={<PropertyDetail user={user} />} />
            <Route path="/property/:id/valuation" element={<PropertyValuation user={user} />} />
            <Route path="/valuation/:id" element={<PropertyValuation user={user} />} />
            <Route path="/valuation" element={<PropertyValuation user={user} />} />
            <Route path="/ml-analytics" element={<MLAnalytics user={user} />} />
            <Route path="/analytics" element={<MLAnalytics user={user} />} />

            {/* PROTECTED BUYER ROUTE */}
            <Route
              path="/buyer"
              element={
                <ProtectedRoute user={user} allowedRoles={['Buyer']}>
                  <BuyerDashboard user={user} onLogout={onLogout} />
                </ProtectedRoute>
              }
            />

            {/* PROTECTED SELLER ROUTE */}
            <Route
              path="/seller"
              element={
                <ProtectedRoute user={user} allowedRoles={['Seller']}>
                  <SellerDashboard user={user} onLogout={onLogout} />
                </ProtectedRoute>
              }
            />

            {/* PROTECTED INVESTOR ROUTE */}
            <Route
              path="/investor"
              element={
                <ProtectedRoute user={user} allowedRoles={['Investor']}>
                  <InvestorDashboard user={user} onLogout={onLogout} />
                </ProtectedRoute>
              }
            />

            {/* DEDICATED AUCTION MODULE ROUTES */}
            <Route
              path="/auctions"
              element={
                <ProtectedRoute user={user}>
                  <LiveAuctionsDashboard user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-auctions"
              element={
                <ProtectedRoute user={user}>
                  <MyAuctions user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auction/:id/join"
              element={
                <ProtectedRoute user={user}>
                  <JoinAuction user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-auction/:id"
              element={
                <ProtectedRoute user={user}>
                  <JoinAuction user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auction/:id/live"
              element={
                <ProtectedRoute user={user}>
                  <LiveAuction user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auction/:id/winner"
              element={
                <ProtectedRoute user={user}>
                  <AuctionWinner user={user} />
                </ProtectedRoute>
              }
            />
            <Route path="/auction-result/:id" element={<AuctionWinner user={user} />} />
            <Route path="/property-sold/:id" element={<AuctionWinner user={user} />} />

            {/* CATCH-ALL ROUTE */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    localStorage.removeItem('realestate_ai_user');
    return sessionStore.read();
  });
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const stored = sessionStore.read();
    if (!stored) { setCheckingSession(false); return; }
    apiService.getSession().then(({ user: verified }) => {
      if (cancelled) return;
      const nextUser = { ...verified, token: stored.token };
      sessionStore.write(nextUser);
      setUser(nextUser);
    }).catch(error => {
      if (cancelled) return;
      sessionStore.clear(); setUser(null);
      if (error.response?.status !== 401) setSessionError('Could not verify your session. Please sign in again.');
    }).finally(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
  }, []);

  const handleLoginSuccess = (userData) => {
    sessionStore.write(userData);
    setUser(userData);
    setSessionError('');
  };

  const handleLogout = async () => {
    try { await apiService.logout(); }
    finally { sessionStore.clear(); setUser(null); }
  };

  if (checkingSession) return <div className="p-12 text-center" role="status">Checking your session...</div>;

  return (
    <Router>
      {sessionError && <p className="p-3 bg-amber-50 text-amber-800 text-center" role="alert">{sessionError}</p>}
      <MainLayout user={user} onLogout={handleLogout} handleLoginSuccess={handleLoginSuccess} />
    </Router>
  );
}
