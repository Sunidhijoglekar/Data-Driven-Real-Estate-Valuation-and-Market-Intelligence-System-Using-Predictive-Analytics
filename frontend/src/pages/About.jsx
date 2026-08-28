import React from 'react';
import { Building2, Cpu, ShieldCheck, TrendingUp, Gavel, Users, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header Banner */}
      <div className="max-w-5xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Next-Generation Real Estate Intelligence
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About RealEstate<span className="text-blue-600">.AI</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          RealEstate.AI is a data-driven platform combining advanced machine learning regression models, time series forecasting, and transparent live auction systems for buyers, sellers, and institutional investors.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-lg font-extrabold text-slate-900">AI Price Valuations</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Engineered with XGBoost and Random Forest algorithms achieving 96.35% R² score for accurate property price predictions across major metropolitan markets.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Gavel className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-lg font-extrabold text-slate-900">Live Auction Arena</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seller-controlled invitation system with token-backed Auction Passes, instant outbid notifications, and automated highest bidder sales.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-lg font-extrabold text-slate-900">Market Intelligence</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            LSTM Neural Network time series projections for 1, 3, and 5-year price forecasts, rental yields, and AI-generated investment recommendations.
          </p>
        </div>

      </div>

      {/* Role Personas Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
        <h2 className="font-heading text-xl font-extrabold text-slate-900 text-center">
          Designed for Every Stakeholder
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Buyer Portal
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Smart Property Search & Bidding</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Search verified property listings</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> AI valuation match scores</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Participate in live property auctions</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Seller Portal
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Listing & Auction Control</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Add & manage property listings</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Seller-controlled auction creation</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Manage buyer passes & finalize sales</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Investor Portal
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Analytics & ROI Forecasting</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> City-wise growth analytics</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 5-Year LSTM price projections</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Gemini AI investment reports</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white text-center space-y-4 shadow-lg">
        <h3 className="font-heading text-2xl font-extrabold">Ready to explore property market intelligence?</h3>
        <p className="text-xs sm:text-sm text-blue-200 max-w-xl mx-auto">
          Log in with your role (Buyer, Seller, or Investor) to access tailored dashboards, predictive models, and auction features.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 font-extrabold text-xs rounded-xl shadow-md hover:bg-blue-50 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Log In to Portal
        </Link>
      </div>

    </div>
  );
}
