import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Gavel, Clock, ShieldCheck, ArrowLeft, MapPin, CheckCircle2,
  AlertCircle, Ticket, Lock, Phone, Mail, User, Send, ChevronRight
} from 'lucide-react';

export default function JoinAuction({ user }) {
  const { id } = useParams(); // property ID or auction ID
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReg, setUserReg] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Form State for Request
  const [phone, setPhone] = useState('+91 98765 43210');

  const buyerId = user ? user.email : 'buyer@example.com';
  const buyerName = user ? user.name : 'Sunidhi Joglekar';

  const loadData = async () => {
    setLoading(true);
    try {
      let aucData = null;
      let propData = null;

      try {
        const aucRes = await apiService.getAuctionById(id);
        if (aucRes && aucRes.auction) {
          aucData = aucRes.auction;
          propData = aucRes.auction.property;
        }
      } catch {
        const propRes = await apiService.getPropertyById(id);
        propData = propRes;
        const aucRes = await apiService.getAuctionByPropertyId(id);
        if (aucRes && aucRes.auction) {
          aucData = aucRes.auction;
        }
      }

      setAuction(aucData);
      setProperty(propData || aucData?.property);

      if (aucData && aucData.registrations) {
        const found = aucData.registrations.find(r => r.buyer_id === buyerId || r.buyer_email === buyerId);
        if (found) {
          setUserReg(found);
        }
      }
    } catch (err) {
      console.error('Error loading join auction details:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load auction registration portal.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [id, buyerId]);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!auction) return;
    setSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await apiService.requestRegistration(auction.auction_id, {
        buyer_id: buyerId,
        buyer_name: buyerName,
        buyer_email: buyerId,
        buyer_phone: phone
      });

      setUserReg(res.registration);
      setStatusMsg({
        type: 'success',
        text: 'Token Registration Request Submitted! The seller will review your request and issue an Auction Token.'
      });
    } catch (err) {
      console.error('Registration request error:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to submit registration request.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Loading Seller Token Portal...</p>
      </div>
    );
  }

  const propImage = property?.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';
  const isAuctionClosed = auction?.status === 'COMPLETED' || auction?.status === 'CANCELLED' || (auction?.auction_end && new Date() > new Date(auction.auction_end));
  const isApproved = userReg && userReg.status === 'APPROVED';
  const isPending = userReg && userReg.status === 'PENDING';
  const isLive = auction && !isAuctionClosed && (auction.status === 'LIVE' || (auction.auction_start && new Date() >= new Date(auction.auction_start) && (!auction.auction_end || new Date() <= new Date(auction.auction_end))));
  const isRegOpen = auction && !isAuctionClosed && !isLive && (auction.status === 'REGISTRATION_OPEN' || auction.status === 'UPCOMING' || (!auction.status || (auction.auction_start && new Date() < new Date(auction.auction_start))));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate('/auctions')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Live Auctions
      </button>

      {/* Main Glassmorphism Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        
        {/* Banner Image & Status Badge */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
          <img
            src={propImage}
            alt={property?.name || 'Property'}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

          {/* Floating Status Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md bg-blue-600/90 text-white border border-white/20 shadow-lg flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" /> Token-Based Auction
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" /> {property?.locality || 'Prime Locality'}, {property?.city || 'Bangalore'}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-white">
              {property?.name || 'Luxury Estate Property'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200">
              <span>Starting Price: <strong className="text-blue-300 font-bold">₹{auction?.starting_price} Lakhs</strong></span>
              <span>•</span>
              <span>Min Increment: <strong className="text-white font-bold">₹{auction?.minimum_increment || 1} Lakhs</strong></span>
              <span>•</span>
              <span>Duration: <strong className="text-white font-bold">{auction?.duration_hours || 24} Hours</strong></span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {statusMsg.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border ${
              statusMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {statusMsg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* STATE 1: APPROVED PARTICIPANT WITH TOKEN */}
          {isApproved && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-slate-900">Authorized Auction Token Issued!</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Token Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    The seller has approved your registration. You hold <strong>1 Auction Token</strong> for this property and are verified to enter the live auction.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate(`/auction/${property?.id || auction?.property_id}/live`)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Gavel className="w-4 h-4" /> Enter Live Bidding Room <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: PENDING SELLER APPROVAL */}
          {isPending && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3 text-amber-900">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-600 animate-pulse shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Registration Request Pending Seller Review</h3>
                  <p className="text-xs text-amber-700">
                    Your token request was submitted to the seller. You will receive a notification once approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: AUCTION CONCLUDED */}
          {!isApproved && !isPending && isAuctionClosed && (
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Auction Concluded</h3>
                <p className="text-base font-bold text-slate-700">
                  This auction has ended.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto pt-1">
                  The property bidding session is closed.
                </p>
              </div>
              <button
                onClick={() => navigate(`/auction-result/${auction?.auction_id || id}`)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                View Final Sale Result
              </button>
            </div>
          )}

          {/* STATE 4: REGISTRATION CLOSED & NOT APPROVED (LIVE OR CLOSED REG) */}
          {!isApproved && !isPending && !isAuctionClosed && !isRegOpen && (
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Registration Closed</h3>
                <p className="text-base font-bold text-slate-700">
                  {isLive ? 'Live Bidding in Progress (Pass Required)' : 'This auction is closed for registration.'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto pt-1">
                  {isLive
                    ? 'Registration for this live session is closed. Pre-authorized token holders are currently bidding. You can view the live room in spectator mode.'
                    : 'The seller has stopped registration. Only pre-authorized buyers with an issued Auction Token can enter and participate in live bidding.'}
                </p>
              </div>
              {isLive && (
                <button
                  onClick={() => navigate(`/auction/${property?.id || auction?.property_id}/live`)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <Gavel className="w-4 h-4" /> View Live Auction (Spectator Mode)
                </button>
              )}
            </div>
          )}

          {/* STATE 4: REGISTRATION OPEN & USER NOT YET REGISTERED */}
          {!userReg && isRegOpen && (
            <form onSubmit={handleRequestToken} className="space-y-5 bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-600" /> Request Auction Token & Join Invitation List
                </h3>
                <p className="text-xs text-slate-500">
                  Registration is currently OPEN. Submit your details below to request an Auction Token directly from the seller.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Full Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={buyerName}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={buyerId}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Phone Number for Verification
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>Submitting Request...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Request Token From Seller
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Workflow Explanation Banner */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Seller-Controlled Token Auction Protocol
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">1. Registration Period</span>
                <p>Seller opens registration. Buyers submit verification requests.</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">2. Token Issuance</span>
                <p>Seller approves buyers and issues 1 Auction Token to authorized participants.</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">3. Live Auction Room</span>
                <p>Only token holders enter bidding. Seller retains final choice on final buyer.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
