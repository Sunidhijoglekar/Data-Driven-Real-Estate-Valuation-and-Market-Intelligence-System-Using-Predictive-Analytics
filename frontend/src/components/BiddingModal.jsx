import React, { useState, useEffect } from 'react';
import { X, Gavel, Clock, Trophy, AlertCircle, CheckCircle2, TrendingUp, User } from 'lucide-react';
import { apiService } from '../services/api';

export default function BiddingModal({ property, user, onClose, onBidSuccess }) {
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState('02d 14h 32m 10s');

  const bids = property.bids || [];
  const highestBidAmount = bids.length > 0 
    ? Math.max(...bids.map(b => b.amount))
    : (property.startingPrice || property.price);
  const minIncrement = property.minIncrement || 1;
  const nextMinBid = highestBidAmount + minIncrement;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(property.auctionEnd || Date.now() + 48 * 3600 * 1000).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        setTimeLeft('AUCTION CONCLUDED');
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [property]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amt = parseFloat(bidAmount);
    if (isNaN(amt) || amt < nextMinBid) {
      setError(`Your bid must be at least ₹${nextMinBid} Lakhs (highest bid + ₹${minIncrement} L increment).`);
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.placeAuctionBid(property.auction_id || property.id, {
        buyer_id: user ? user.email : "buyer@apexrealty.com",
        bid_amount: amt
      });

      setSuccess(`Congratulations! Your bid of ₹${amt} Lakhs has been recorded as the top bid.`);
      setBidAmount('');
      if (onBidSuccess) onBidSuccess(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Gavel className="w-4 h-4" />
            Live Property Bidding Auction
          </div>
          <h2 className="font-heading text-xl font-bold">{property.name}</h2>
          <p className="text-slate-400 text-xs mt-1">{property.locality}, {property.city}</p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Auction Timer & Top Bid Banner */}
          <div className="grid grid-cols-2 gap-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-800/70 block">Current Highest Bid</span>
              <span className="font-heading text-2xl font-extrabold text-amber-900">₹{highestBidAmount} Lakhs</span>
            </div>
            <div className="text-right border-l border-amber-200 pl-3">
              <span className="text-[10px] uppercase font-bold text-amber-800/70 block flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Timer
              </span>
              <span className="text-xs font-bold text-amber-900 block mt-1">{timeLeft}</span>
            </div>
          </div>

          {/* Bid Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              Place Your Bid (Min allowed: ₹{nextMinBid} Lakhs)
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.5"
                placeholder={`Enter amount e.g. ${nextMinBid}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full pl-8 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">Lakhs</span>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Gavel className="w-4 h-4" />
              {loading ? 'Submitting Bid...' : 'Submit Instant Bid'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
