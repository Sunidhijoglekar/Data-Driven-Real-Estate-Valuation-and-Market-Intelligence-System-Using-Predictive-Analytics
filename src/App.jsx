import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import MLAnalytics from './pages/MLAnalytics';
import PropertyDetail from './pages/PropertyDetail';
import JoinAuction from './pages/JoinAuction';
import LiveAuction from './pages/LiveAuction';
import AuctionWinner from './pages/AuctionWinner';
import LiveAuctionsDashboard from './pages/LiveAuctionsDashboard';
import MyAuctions from './pages/MyAuctions';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('realestate_ai_user');
    return saved ? JSON.parse(saved) : { name: 'Sunidhi Joglekar', email: 'buyer@example.com', role: 'Buyer' };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('realestate_ai_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('realestate_ai_user');
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
        <div>
          <Navbar user={user} onLogout={handleLogout} />
          <main>
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
              
              <Route path="/buyer" element={<BuyerDashboard user={user} />} />
              <Route path="/seller" element={<SellerDashboard user={user} />} />
              <Route path="/investor" element={<InvestorDashboard user={user} />} />
              <Route path="/ml-analytics" element={<MLAnalytics />} />
              <Route path="/property/:id" element={<PropertyDetail user={user} />} />
              
              {/* Dedicated Auction Module Routes */}
              <Route path="/auctions" element={<LiveAuctionsDashboard user={user} />} />
              <Route path="/my-auctions" element={<MyAuctions user={user} />} />
              <Route path="/auction/:id/join" element={<JoinAuction user={user} />} />
              <Route path="/join-auction/:id" element={<JoinAuction user={user} />} />
              <Route path="/auction/:id/live" element={<LiveAuction user={user} />} />
              <Route path="/auction/:id/winner" element={<AuctionWinner user={user} />} />
              <Route path="/auction-result/:id" element={<AuctionWinner user={user} />} />
              <Route path="/property-sold/:id" element={<AuctionWinner user={user} />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
