import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Gavel, Clock, CheckCircle2, AlertCircle, XCircle, Users, Building2,
  ArrowRight, ArrowLeft, ShieldCheck, Ticket, Lock, Trophy, Sparkles, Filter
} from 'lucide-react';

export default function MyAuctions({ user }) {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [userRegs, setUserRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // PENDING, APPROVED, REG_CLOSED, LIVE, WON, LOST

  const buyerId = user ? user.email : 'buyer@example.com';

  const fetchData = async () => {
    try {
      const [aucRes, regRes] = await Promise.all([
        apiService.getAuctions(),
        apiService.getUserRegistrations(buyerId)
      ]);

      if (aucRes && aucRes.auctions) {
        setAuctions(aucRes.auctions);
      }
      if (regRes && regRes.registrations) {
        setUserRegs(regRes.registrations);
      }
    } catch (err) {
      console.error('Error fetching My Auctions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [buyerId]);

  // Compute status helpers per auction
  const isPendingApproval = (auc) => {
    const reg = userRegs.find(r => r.auction_id === auc.auction_id || String(r.property_id) === String(auc.property_id));
    return reg && reg.status === 'PENDING';
  };

  const isApproved = (auc) => {
    const reg = userRegs.find(r => r.auction_id === auc.auction_id || String(r.property_id) === String(auc.property_id));
    return reg && reg.status === 'APPROVED';
  };

  const isRegClosedForUser = (auc) => {
    const reg = userRegs.find(r => r.auction_id === auc.auction_id || String(r.property_id) === String(auc.property_id));
    return auc.status === 'REGISTRATION_CLOSED' && (!reg || reg.status !== 'APPROVED');
  };

  const isLiveAuction = (auc) => {
    return auc.status === 'LIVE' || auc.status === 'PAUSED' || auc.status === 'FROZEN';
  };

  const isWonAuction = (auc) => {
    return auc.status === 'COMPLETED' && (auc.winner_id === buyerId || auc.sale_summary?.buyer_id === buyerId);
  };

  const isLostAuction = (auc) => {
    const wasParticipant = isApproved(auc) || (auc.bids && auc.bids.some(b => b.buyer_id === buyerId));
    return auc.status === 'COMPLETED' && wasParticipant && auc.winner_id && auc.winner_id !== buyerId;
  };

  // Filter categorization
  const pendingList = auctions.filter(a => isPendingApproval(a));
  const approvedList = auctions.filter(a => isApproved(a));
  const regClosedList = auctions.filter(a => isRegClosedForUser(a));
  const liveList = auctions.filter(a => isLiveAuction(a));
  const wonList = auctions.filter(a => isWonAuction(a));
  const lostList = auctions.filter(a => isLostAuction(a));

  const getFilteredAuctions = () => {
    switch (activeFilter) {
      case 'PENDING':
        return pendingList;
      case 'APPROVED':
        return approvedList;
      case 'REG_CLOSED':
        return regClosedList;
      case 'LIVE':
        return liveList;
      case 'WON':
        return wonList;
      case 'LOST':
        return lostList;
      default:
        return auctions;
    }
  };

  const displayedList = getFilteredAuctions();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Loading Buyer Auction Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <button
          onClick={() => navigate('/buyer-dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Buyer Dashboard &rarr;
        </button>
      </div>

      {/* Page Title */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit">
          <Ticket className="w-3.5 h-3.5" /> Buyer Token Dashboard
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black">My Auctions & Token Registrations</h1>
        <p className="text-xs text-slate-300 max-w-xl">
          Track your token requests, approved seller invitations, active live auctions, and property purchase results in real time.
        </p>
      </div>

      {/* FILTER TABS (EXACT MATCH FOR BUYER DASHBOARD SPECIFICATION) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Auctions ({auctions.length})
        </button>

        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'PENDING'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending Approval ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveFilter('APPROVED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" /> Approved ({approvedList.length})
        </button>

        <button
          onClick={() => setActiveFilter('REG_CLOSED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'REG_CLOSED'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> Registration Closed ({regClosedList.length})
        </button>

        <button
          onClick={() => setActiveFilter('LIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'LIVE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <Gavel className="w-3.5 h-3.5" /> Live Auctions ({liveList.length})
        </button>

        <button
          onClick={() => setActiveFilter('WON')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'WON'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Won Auctions ({wonList.length})
        </button>

        <button
          onClick={() => setActiveFilter('LOST')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'LOST'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" /> Lost Auctions ({lostList.length})
        </button>
      </div>

      {/* AUCTION LIST CARDS */}
      {displayedList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Filter className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No auctions match this category filter.</p>
          <p className="text-xs text-slate-500">Explore live property listings to request an Auction Token.</p>
          <button
            onClick={() => navigate('/auctions')}
            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg mt-2 inline-block"
          >
            Browse All Auctions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedList.map(auc => {
            const prop = auc.property || {};
            const approved = isApproved(auc);
            const pending = isPendingApproval(auc);
            const regClosed = isRegClosedForUser(auc);
            const won = isWonAuction(auc);
            const lost = isLostAuction(auc);

            return (
              <div
                key={auc.auction_id}
                className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div>
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    <img
                      src={prop.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'}
                      alt={prop.name || 'Property'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-3 right-3">
                      {won ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-lg flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Won & Purchased
                        </span>
                      ) : lost ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg">
                          Auction Concluded
                        </span>
                      ) : approved ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-lg flex items-center gap-1">
                          <Ticket className="w-3 h-3" /> Token Approved
                        </span>
                      ) : pending ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Seller
                        </span>
                      ) : regClosed ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-700 text-white shadow-lg flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Reg Closed
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-lg">
                          {auc.status}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-heading text-base font-black truncate">{prop.name || 'Property'}</h3>
                      <p className="text-[11px] text-slate-300 truncate">{prop.locality}, {prop.city}</p>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Starting Price:</span>
                      <span className="font-bold text-slate-900">₹{auc.starting_price} Lakhs</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Current Highest Bid:</span>
                      <span className="font-black text-emerald-600">₹{auc.current_highest_bid || auc.starting_price} Lakhs</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Participants:</span>
                      <span className="font-bold text-slate-800">{auc.total_participants || 0} Token Holders</span>
                    </div>

                    {regClosed && (
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600 text-center">
                        This auction is closed for registration.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  {approved ? (
                    <button
                      onClick={() => navigate(`/auction/${prop.id || auc.property_id}/live`)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Gavel className="w-3.5 h-3.5" /> Enter Live Bidding
                    </button>
                  ) : won ? (
                    <button
                      onClick={() => navigate(`/auction-result/${auc.auction_id}`)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Trophy className="w-3.5 h-3.5" /> View Sale Summary
                    </button>
                  ) : pending ? (
                    <button
                      onClick={() => navigate(`/join-auction/${prop.id || auc.property_id}`)}
                      className="w-full py-2.5 bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> View Request Status
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/join-auction/${prop.id || auc.property_id}`)}
                      className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
                    >
                      Auction Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
