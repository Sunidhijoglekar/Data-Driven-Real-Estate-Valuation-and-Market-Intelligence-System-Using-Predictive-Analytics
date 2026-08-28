import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Gavel, Clock, Users, ShieldCheck, ArrowLeft, Building2, MapPin, Sparkles, CheckCircle2,
  AlertCircle, ArrowUpRight, Lock, Ticket, AlertTriangle, Snowflake, PauseCircle
} from 'lucide-react';

export default function LiveAuction({ user }) {
  const { id } = useParams(); // property ID or auction ID
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 1 });

  const buyerId = user ? user.email : 'buyer@example.com';
  const buyerName = user ? user.name : 'Sunidhi Joglekar';

  // Fetch auction details
  const fetchAuctionState = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let aucRes = null;
      try {
        aucRes = await apiService.getAuctionById(id);
      } catch {
        aucRes = await apiService.getAuctionByPropertyId(id);
      }

      if (aucRes && aucRes.auction) {
        const auc = aucRes.auction;
        setAuction(auc);
        setProperty(auc.property);

        // Pre-fill next min bid
        const currentHighest = auc.current_highest_bid || auc.starting_price;
        const nextMin = currentHighest + (auc.minimum_increment || 1);
        setBidAmount(prev => (!prev || parseFloat(prev) <= currentHighest ? String(nextMin) : prev));

        if (auc.status === 'COMPLETED') {
          navigate(`/auction-result/${auc.auction_id}`);
        }
      }
    } catch (err) {
      console.error('Error fetching live auction state:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionState();
    const pollInterval = setInterval(() => {
      fetchAuctionState(true);
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!auction || !auction.auction_end) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.auction_end).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, totalMs: diff });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  // Check if buyer has token/authorized participant status
  const isAuthorizedParticipant = auction?.participants?.some(p => p.buyer_id === buyerId || p.buyer_email === buyerId) ||
    auction?.registrations?.some(r => (r.buyer_id === buyerId || r.buyer_email === buyerId) && r.status === 'APPROVED');

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!auction) return;

    setStatusMsg({ type: '', text: '' });
    const val = parseFloat(bidAmount);
    const minInc = auction.minimum_increment || 1;
    const currentHighest = auction.current_highest_bid;

    if (!val || isNaN(val)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid bid amount in Lakhs.' });
      return;
    }

    if (auction.bids && auction.bids.length > 0) {
      if (val < currentHighest + minInc) {
        setStatusMsg({
          type: 'error',
          text: `Bid must be at least ₹${currentHighest + minInc} Lakhs (Current Highest: ₹${currentHighest} Lakhs + Min Increment: ₹${minInc} Lakhs).`
        });
        return;
      }
    } else {
      if (val < auction.starting_price) {
        setStatusMsg({
          type: 'error',
          text: `Bid must be at least the starting price of ₹${auction.starting_price} Lakhs.`
        });
        return;
      }
    }

    setBidding(true);
    try {
      await apiService.placeAuctionBid(auction.auction_id, {
        buyerId,
        buyerName,
        bidAmount: val
      });

      setStatusMsg({ type: 'success', text: `Your bid of ₹${val} Lakhs was successfully placed!` });
      await fetchAuctionState(true);
    } catch (err) {
      console.error('Place bid error:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to place bid.'
      });
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Connecting to Real-time Bidding Server...</p>
      </div>
    );
  }

  // GATING: IF NOT AUTHORIZED TOKEN PARTICIPANT
  if (!isAuthorizedParticipant) {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4 space-y-6">
        <button
          onClick={() => navigate('/auctions')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Auctions
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black uppercase tracking-wider">
              Access Restricted
            </span>
            <h2 className="text-xl font-black text-slate-900">This auction is closed for registration.</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              This is a Seller-Controlled Invitation & Token-Based Auction. Only pre-authorized buyers possessing an approved Auction Token may enter the live bidding room.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate(`/join-auction/${property?.id || id}`)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              Check Token Registration
            </button>
            <button
              onClick={() => navigate('/my-auctions')}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              My Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const propImage = property?.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';
  const bids = auction?.bids || [];
  const isFrozen = auction?.status === 'FROZEN';
  const isPaused = auction?.status === 'PAUSED';
  const isLive = auction?.status === 'LIVE';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/auctions')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Auctions
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" /> Authorized Token Holder
          </span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Participant
          </span>
        </div>
      </div>

      {/* STATUS ANNOUNCEMENT BANNERS */}
      {isFrozen && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Snowflake className="w-7 h-7 text-cyan-400 animate-pulse" />
            <div>
              <h3 className="font-heading text-sm font-black text-cyan-300 uppercase tracking-wider">Bidding Frozen by Seller</h3>
              <p className="text-xs text-slate-300">No buyer can place additional bids. You may view the final live bid history while the seller makes a sale decision.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-cyan-900 text-cyan-200 text-[10px] font-black uppercase tracking-widest rounded-full border border-cyan-500/30">
            Frozen State
          </span>
        </div>
      )}

      {isPaused && (
        <div className="bg-amber-50 text-amber-900 p-5 rounded-2xl border border-amber-300 shadow-lg flex items-center gap-3">
          <PauseCircle className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="font-bold text-sm">Auction Paused by Seller</h3>
            <p className="text-xs text-amber-700">Live bidding is temporarily paused. Please hold while the seller resumes the auction.</p>
          </div>
        </div>
      )}

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: PROPERTY DETAILS & IMAGE */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-slate-900">
              <img
                src={propImage}
                alt={property?.name || 'Property Image'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/20">
                  {property?.bhk ? `${property.bhk} BHK` : 'Luxury Property'}
                </span>
                <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/20">
                  {property?.area || '2,400'} sq.ft
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h1 className="font-heading text-2xl font-black">{property?.name || 'Property'}</h1>
                <p className="text-xs text-slate-300 flex items-center gap-1 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> {property?.locality || 'Locality'}, {property?.city || 'City'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Details</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {property?.description || 'Exclusive luxury residential property available through seller-controlled token auction.'}
              </p>

              {property?.amenities && Array.isArray(property.amenities) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {property.amenities.map((am, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                      {am}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LIVE BID HISTORY */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-blue-600" /> Live Bid History ({bids.length})
              </h3>
              <span className="text-[11px] font-bold text-slate-500">Real-Time Sync</span>
            </div>

            {bids.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-medium space-y-1">
                <p>No bids placed yet.</p>
                <p className="text-[11px] text-slate-400">Be the first authorized bidder to place an offer!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {bids.map((b, idx) => (
                  <div
                    key={b.bid_id || idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      idx === 0
                        ? 'bg-blue-50/80 border-blue-200 ring-1 ring-blue-400/30'
                        : 'bg-slate-50 border-slate-200/70'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{b.bidder_name}</span>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded-full">
                            Current Highest
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(b.bid_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-heading text-base font-black text-slate-900">₹{b.bid_amount} Lakhs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE BIDDING CONTROLS & COUNTDOWN */}
        <div className="lg:col-span-5 space-y-6">

          {/* COUNTDOWN TIMER & HIGHEST BID CARD */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

            {/* Timer Banner */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" /> Remaining Time
              </span>
              <div className="font-mono text-lg font-black text-blue-400 tracking-wider">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Highest Bid</span>
                <div className="font-heading text-2xl font-black text-emerald-400">
                  ₹{auction?.current_highest_bid || auction?.starting_price || 0} <span className="text-xs font-normal text-slate-400">Lakhs</span>
                </div>
                <div className="text-[10px] text-slate-300 font-semibold truncate">
                  By: {auction?.highest_bidder_name || 'Starting Offer'}
                </div>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starting Price</span>
                <div className="font-heading text-xl font-bold text-white">
                  ₹{auction?.starting_price || 0} <span className="text-xs font-normal text-slate-400">Lakhs</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Min Inc: ₹{auction?.minimum_increment || 1} Lakhs
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-blue-400" /> Authorized Participants:
              </span>
              <span className="font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                {auction?.total_participants || 1}
              </span>
            </div>
          </div>

          {/* BID INPUT & PLACE BID BUTTON */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-blue-600" /> Place Bid
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                1 Token Active
              </span>
            </div>

            {statusMsg.text && (
              <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                statusMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {isFrozen ? (
              <div className="p-4 bg-slate-100 rounded-2xl text-center space-y-2 text-slate-700">
                <Snowflake className="w-6 h-6 text-cyan-600 mx-auto" />
                <p className="text-xs font-bold">Bidding Frozen by Seller</p>
                <p className="text-[11px] text-slate-500">The seller is evaluating offers. No additional bids can be placed at this time.</p>
              </div>
            ) : isPaused ? (
              <div className="p-4 bg-amber-50 rounded-2xl text-center space-y-2 text-amber-800">
                <PauseCircle className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="text-xs font-bold">Auction Paused</p>
                <p className="text-[11px] text-amber-700">Please wait for the seller to resume bidding.</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Enter Bid Amount (₹ Lakhs)</span>
                    <span className="text-slate-500 font-semibold text-[10px]">
                      Min Next Bid: ₹{(auction?.current_highest_bid || auction?.starting_price) + (auction?.minimum_increment || 1)} Lakhs
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-16 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Lakhs</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bidding}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  {bidding ? (
                    <>Placing Bid...</>
                  ) : (
                    <>
                      <Gavel className="w-4 h-4" /> Place Authorized Bid Now
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <p className="font-bold text-slate-700">Seller-Controlled Auction Rule:</p>
              <p className="leading-tight">
                Placing the highest bid makes you a top candidate, but final sale decision rests strictly with the seller.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
