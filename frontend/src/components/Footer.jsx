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
                Apex<span className="text-blue-400">Realty</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
              Commercial Real Estate Valuation and Market Intelligence System Using Predictive Analytics. Integrates Random Forest, XGBoost, ARIMA, LSTM, and Advanced Analytics.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-blue-400" /> XGBoost & LSTM</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Market Insights</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Institutional Quality</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">System Portals</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/buyer" className="hover:text-white transition-colors">Buyer Search & Match</a></li>
              <li><a href="/seller" className="hover:text-white transition-colors">Seller Listings & Auctions</a></li>
              <li><a href="/investor" className="hover:text-white transition-colors">Investor Analytics & Yields</a></li>
              <li><a href="/ml-analytics" className="hover:text-white transition-colors">Model Analytics & Algorithms</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Bangalore Micro-Markets</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Whitefield & ITPL Corridor</li>
              <li>Outer Ring Road (ORR) & Bellandur</li>
              <li>Koramangala & HSR Layout</li>
              <li>Indiranagar & C V Raman Nagar</li>
              <li>Electronic City & Sarjapur</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500">
          © 2026 ApexRealty Commercial Real Estate System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
