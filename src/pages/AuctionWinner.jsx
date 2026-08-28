import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Trophy, Sparkles, Building2, MapPin, CheckCircle2, ArrowRight,
  ShieldCheck, DollarSign, Award, Users, Gavel, Calendar, Mail, FileText, ArrowLeft
} from 'lucide-react';

export default function AuctionWinner({ user }) {
  const { id } = useParams(); // property ID or auction ID
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [property, setProperty] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      let aucData = null;
      try {
        const res = await apiService.getAuctionById(id);
        if (res && res.auction) aucData = res.auction;
      } catch {
        const res = await apiService.getAuctionByPropertyId(id);
        if (res && res.auction) aucData = res.auction;
      }

      if (aucData) {
        setAuction(aucData);
        setProperty(aucData.property);

        // Fetch AI winner report
        try {
          const reportRes = await apiService.getWinnerAiReport(aucData.auction_id);
          if (reportRes && reportRes.winnerAiReport) {
            setAiReport(reportRes.winnerAiReport);
          }
        } catch (e) {
          console.warn('AI report fetch warning:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching auction result:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Generating Official Property Sale Summary & Gemini AI Report...</p>
      </div>
    );
  }

  const prop = property || auction?.property || {};
  const summary = auction?.sale_summary || {};
  const finalPrice = summary.final_selling_price || auction?.current_highest_bid || prop.price || 0;
  const buyerName = summary.buyer_name || auction?.winner_name || 'Sunidhi Joglekar';
  const buyerEmail = summary.buyer_email || auction?.winner_id || 'buyer@example.com';
  const sellerEmail = summary.seller_email || auction?.seller_id || 'seller@apexrealty.com';
  const totalBids = summary.total_bids_placed || auction?.bids?.length || 0;
  const totalParticipants = summary.total_participants || auction?.total_participants || 1;
  const soldAtTime = summary.sold_at ? new Date(summary.sold_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/my-auctions')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Auctions
      </button>

      {/* VICTORY & SOLD BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-amber-400/40 space-y-4">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Trophy className="w-80 h-80 text-white" />
        </div>

        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-100 w-fit border border-white/20">
          <Award className="w-4 h-4 text-amber-200" /> Official Property Sale Summary
        </div>

        <div className="space-y-1">
          <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight">
            Property Auction Concluded & Sold
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
            The seller has finalized the property transaction. The sale record is permanently registered in the database.
          </p>
        </div>
      </div>

      {/* PROPERTY SUMMARY CARD & SOLD BADGE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        <div className="relative h-72 w-full bg-slate-900">
          <img
            src={prop.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'}
            alt={prop.name || 'Property'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* PROMINENT SOLD BADGE */}
          <div className="absolute top-4 right-4">
            <span className="px-5 py-2 bg-rose-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" /> SOLD
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5" /> {prop.locality}, {prop.city}
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-black">{prop.name}</h2>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="p-6 sm:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Final Selling Price</span>
              <div className="font-heading text-2xl font-black text-emerald-700">₹{finalPrice} Lakhs</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Selected Buyer</span>
              <div className="font-bold text-slate-900 text-sm truncate">{buyerName}</div>
              <p className="text-[10px] text-slate-500 truncate">{buyerEmail}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Verified Seller</span>
              <div className="font-bold text-slate-900 text-sm truncate">Property Seller</div>
              <p className="text-[10px] text-slate-500 truncate">{sellerEmail}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Auction Activity</span>
              <div className="font-bold text-slate-900 text-sm">{totalBids} Bids Placed</div>
              <p className="text-[10px] text-slate-500">{totalParticipants} Token Holders</p>
            </div>
          </div>

          {/* SALE SUMMARY DATA SHEET */}
          <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Verified Transaction Record
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Auction ID:</span>
                <span className="font-bold text-slate-900">{auction?.auction_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Transaction Date:</span>
                <span className="font-bold text-slate-900">{soldAtTime}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Auction Protocol:</span>
                <span className="font-bold text-blue-600">Seller-Controlled Token Auction</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Listing Status:</span>
                <span className="font-bold text-rose-600 uppercase">Removed from Active Listings</span>
              </div>
            </div>
          </div>

          {/* GEMINI AI ANALYTICS REPORT */}
          {aiReport && (
            <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white space-y-4 shadow-xl border border-blue-800/50">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-400" /> Gemini AI Valuation & Victory Report
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-blue-200 uppercase font-bold">Estimated Market Value</span>
                  <div className="text-xl font-black text-white">₹{aiReport.estimated_market_value_lakhs} Lakhs</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-blue-200 uppercase font-bold">Value Score</span>
                  <div className="text-xl font-black text-emerald-300">{aiReport.value_score}</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-blue-200 uppercase font-bold">5-Yr Price Projection</span>
                  <div className="text-xl font-black text-amber-300">₹{aiReport.five_year_projection_lakhs} Lakhs</div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-300 leading-relaxed space-y-2">
                <p><strong>Investment Analysis:</strong> {aiReport.market_verdict}</p>
                <p><strong>Strategic Advice:</strong> {aiReport.strategic_advice}</p>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={() => navigate('/my-auctions')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              Return to Buyer Dashboard
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
