import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Gavel, Search, SlidersHorizontal, Users, Flame, Clock, Trophy, CheckCircle2,
  AlertCircle, ArrowRight, ArrowLeft, Building2, MapPin, DollarSign, Filter, Sparkles, TrendingUp, ShieldCheck
} from 'lucide-react';

export default function LiveAuctionsDashboard({ user }) {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedBhk, setSelectedBhk] = useState('All');
  const [maxBudget, setMaxBudget] = useState('');

  const fetchAuctionsData = async () => {
    try {
      const res = await apiService.getAuctions();
      if (res && res.auctions) {
        setAuctions(res.auctions);
      }
    } catch (err) {
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    if (user?.email) {
      try {
        const res = await apiService.getUserRegistrations(user.email);
        setUserRegistrations(Array.isArray(res) ? res : (res?.registrations || []));
      } catch (err) {
        console.error('Error fetching user registrations:', err);
      }
    }
  };

  useEffect(() => {
    fetchAuctionsData();
    fetchUserRegistrations();
    // Poll every 3 seconds for live updates
    const pollInterval = setInterval(() => {
      fetchAuctionsData();
      fetchUserRegistrations();
    }, 3000);
    // Timer tick every 1 second
    const timerInterval = setInterval(() => setNow(new Date()), 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [user?.email]);

  // Compute auction status string according to spec: Live / Registration Open / Closed
  const getAuctionDisplayStatus = (auc) => {
    if (auc.status === 'CANCELLED' || auc.status === 'COMPLETED') return 'Closed';
    const start = new Date(auc.auction_start);
    const end = new Date(auc.auction_end);
    if (now < start) return 'Registration Open';
    if (now > end) return 'Closed';
    return 'Live';
  };

  const getAuctionComputedStatus = (auc) => {
    if (auc.status === 'CANCELLED') return 'CANCELLED';
    if (auc.status === 'COMPLETED') return 'ENDED';
    const start = new Date(auc.auction_start);
    const end = new Date(auc.auction_end);
    if (now < start) return 'UPCOMING';
    if (now > end) return 'ENDED';
    return 'LIVE';
  };

  // Helper for format time remaining
  const getTimeRemaining = (endTimeStr) => {
    const total = Date.parse(endTimeStr) - Date.parse(now);
    if (total <= 0) return 'Ended';

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Summary Metrics
  const liveCount = auctions.filter(a => getAuctionComputedStatus(a) === 'LIVE').length;
  const upcomingCount = auctions.filter(a => getAuctionComputedStatus(a) === 'UPCOMING').length;
  const endedCount = auctions.filter(a => getAuctionComputedStatus(a) === 'ENDED').length;
  const totalParticipants = auctions.reduce((acc, a) => acc + (a.total_participants || 0), 0);
  const totalPropertiesUnderAuction = auctions.length;

  // Cities & Types for Filter Dropdowns
  const cities = ['All', ...new Set(auctions.map(a => a.property?.city).filter(Boolean))];
  const types = ['All', ...new Set(auctions.map(a => a.property?.type).filter(Boolean))];

  // Filtered Auctions
  const filteredAuctions = auctions.filter(auc => {
    const prop = auc.property || {};
    const computedStatus = getAuctionComputedStatus(auc);

    // Search query
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = prop.name?.toLowerCase().includes(q);
      const matchCity = prop.city?.toLowerCase().includes(q);
      const matchLocality = prop.locality?.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchLocality) return false;
    }

    // City
    if (selectedCity !== 'All' && prop.city !== selectedCity) return false;

    // Type
    if (selectedType !== 'All' && prop.type !== selectedType) return false;

    // Status
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'Live' && computedStatus !== 'LIVE') return false;
      if (selectedStatus === 'Upcoming' && computedStatus !== 'UPCOMING') return false;
      if (selectedStatus === 'Ended' && computedStatus !== 'ENDED') return false;
    }

    // BHK
    if (selectedBhk !== 'All') {
      if (selectedBhk === '4+' && prop.bhk < 4) return false;
      if (selectedBhk !== '4+' && prop.bhk !== parseInt(selectedBhk)) return false;
    }

    // Budget
    if (maxBudget) {
      const maxB = parseFloat(maxBudget);
      const currPrice = auc.current_highest_bid || auc.starting_price || prop.price;
      if (currPrice > maxB) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/buyer-dashboard')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Buyer Dashboard
        </button>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          &larr; Previous Page
        </button>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            Live Property Bidding Arena
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
            Online Real Estate Auctions
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Discover verified luxury, residential, and commercial properties up for live digital bidding. Track real-time highest bids, participant counts, and ML market valuations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10 shrink-0 w-full md:w-auto">
          <button
            onClick={() => navigate('/my-auctions')}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            My Auctions Portal
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS (DYNAMIC) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Live Auctions</span>
            <span className="font-heading text-xl font-black text-slate-900">{liveCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Upcoming</span>
            <span className="font-heading text-xl font-black text-slate-900">{upcomingCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Completed</span>
            <span className="font-heading text-xl font-black text-slate-900">{endedCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Total Bidders</span>
            <span className="font-heading text-xl font-black text-slate-900">{totalParticipants}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Listed Properties</span>
            <span className="font-heading text-xl font-black text-slate-900">{totalPropertiesUnderAuction}</span>
          </div>
        </div>

      </div>

      {/* FILTERS BAR */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search property name, city, or locality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-auto text-xs font-semibold">
            
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Live">🔥 Live Now</option>
              <option value="Upcoming">⏳ Upcoming</option>
              <option value="Ended">🏁 Ended</option>
            </select>

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            >
              {cities.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            >
              {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>

            {/* BHK Filter */}
            <select
              value={selectedBhk}
              onChange={(e) => setSelectedBhk(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            >
              <option value="All">All BHKs</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4+">4+ BHK</option>
            </select>

            {/* Max Budget Filter */}
            <input
              type="number"
              placeholder="Max Price (₹ L)"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-normal"
            />

          </div>

        </div>
      </div>

      {/* AUCTION CARDS GRID */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading Live Real Estate Auctions...</p>
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Gavel className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-slate-800 text-sm">No Auctions Match Your Search Filters</h3>
          <p className="text-xs text-slate-500">Try adjusting your status, budget, or city dropdown choices above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map(auc => {
            const prop = auc.property || {};
            const compStatus = getAuctionComputedStatus(auc);
            const displayStatus = getAuctionDisplayStatus(auc);
            const timeRem = getTimeRemaining(auc.auction_end);
            const currentHighest = auc.current_highest_bid || auc.starting_price || prop.price;
            const buyerEmail = user?.email || 'buyer@example.com';

            // Check if buyer has an Auction Pass (Token)
            const isParticipant = auc.participants && auc.participants.some(
              p => p.buyer_id === buyerEmail || p.buyer_email === buyerEmail
            );
            const hasApprovedReg = userRegistrations.some(
              r => ((r.auction_id && String(r.auction_id) === String(auc.auction_id)) ||
                    (r.property_id && (String(r.property_id) === String(auc.property_id) || String(r.property_id) === String(prop.id)))) &&
                   r.status === 'APPROVED'
            );
            const hasApprovedInAuc = auc.registrations && auc.registrations.some(
              r => (r.buyer_id === buyerEmail || r.buyer_email === buyerEmail) && r.status === 'APPROVED'
            );
            const hasAuctionPass = Boolean(isParticipant || hasApprovedReg || hasApprovedInAuc);

            return (
              <div
                key={auc.auction_id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
              >
                
                <div>
                  {/* Property Image & Status Badges */}
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img
                      src={prop.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'}
                      alt={prop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                    {/* Status Pill */}
                    <div className="absolute top-3 left-3">
                      {displayStatus === 'Live' && (
                        <span className="px-3 py-1 bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1.5 border border-amber-300">
                          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                          LIVE
                        </span>
                      )}
                      {displayStatus === 'Registration Open' && (
                        <span className="px-3 py-1 bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 border border-blue-400">
                          <Clock className="w-3 h-3" />
                          REGISTRATION OPEN
                        </span>
                      )}
                      {displayStatus === 'Closed' && (
                        <span className="px-3 py-1 bg-slate-800 text-slate-200 font-black text-[10px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 border border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          CLOSED
                        </span>
                      )}
                    </div>

                    {/* Timer Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-mono font-bold text-xs border border-white/20 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {timeRem}
                    </div>

                    {/* Property Title & Location Overlay */}
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block">
                        {prop.type || 'Residential'} • {prop.bhk} BHK
                      </span>
                      <h3 className="font-heading text-base font-extrabold truncate">{prop.name}</h3>
                      <p className="text-xs text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">{prop.locality ? `${prop.locality}, ${prop.city}` : prop.city}</span>
                      </p>
                    </div>
                  </div>

                  {/* Auction Bidding Metrics Grid */}
                  <div className="p-5 space-y-4">
                    
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Location</span>
                        <strong className="text-slate-700 text-xs font-bold truncate block">{prop.city}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-amber-600 uppercase font-extrabold block flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          Current Highest Bid
                        </span>
                        <strong className="text-amber-700 text-sm font-black">₹{currentHighest} Lakhs</strong>
                      </div>
                    </div>

                    {/* Additional Required Details */}
                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Auction Status:</span>
                        <strong className={`font-bold ${displayStatus === 'Live' ? 'text-amber-600' : displayStatus === 'Registration Open' ? 'text-blue-600' : 'text-slate-500'}`}>
                          {displayStatus}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span>Remaining Time:</span>
                        <strong className="text-slate-800 font-mono">{timeRem}</strong>
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span>Auction Pass Token:</span>
                        {hasAuctionPass ? (
                          <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Pass Active
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Card Action Controls & Auction Pass Logic */}
                <div className="p-5 pt-0 space-y-2">
                  
                  {/* Join Auction Button or No Pass Notice */}
                  {hasAuctionPass ? (
                    <button
                      onClick={() => navigate(`/auction/${prop.id}/live`)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Gavel className="w-4 h-4" />
                      Join Auction
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Registration Closed or No Auction Pass Available.
                      </p>
                      {displayStatus === 'Registration Open' && (
                        <button
                          onClick={() => navigate(`/auction/${prop.id}/join`)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline block mx-auto cursor-pointer"
                        >
                          Get Auction Pass (Token)
                        </button>
                      )}
                    </div>
                  )}

                  {/* View Auction Button */}
                  <button
                    onClick={() => navigate(`/auction/${prop.id}/live`)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    View Auction
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
