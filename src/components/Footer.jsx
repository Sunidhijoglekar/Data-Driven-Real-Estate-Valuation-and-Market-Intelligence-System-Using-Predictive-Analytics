import React from 'react';
import { Building2, Cpu, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-white text-lg">
                RealEstate<span className="text-blue-400">.AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
              Final Year Engineering Capstone Project: "Data-Driven Real Estate Valuation and Market Intelligence System Using Predictive Analytics". Integrates Random Forest, XGBoost, ARIMA, LSTM, and Gemini AI.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-blue-400" /> XGBoost & LSTM</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Gemini Insights</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Production Quality</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">System Modules</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/buyer" className="hover:text-white transition-colors">Buyer Search & Match</a></li>
              <li><a href="/seller" className="hover:text-white transition-colors">Seller Property & Auctions</a></li>
              <li><a href="/investor" className="hover:text-white transition-colors">Investor Analytics & Yields</a></li>
              <li><a href="/ml-analytics" className="hover:text-white transition-colors">ML & Time-Series Models</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Supported Cities</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Mumbai & Suburbs</li>
              <li>Delhi NCR (Gurugram/Noida)</li>
              <li>Bangalore (Whitefield/ORR)</li>
              <li>Hyderabad (Financial District)</li>
              <li>Pune & Chennai</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500">
          © 2026 RealEstate.AI Market Intelligence System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
