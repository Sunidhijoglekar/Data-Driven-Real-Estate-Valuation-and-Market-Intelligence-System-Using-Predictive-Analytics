import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import AIPredictionModal from '../components/AIPredictionModal';
import { apiService } from '../services/api';
import {
  TrendingUp, PieChart, LineChart, FileText, Bookmark, Bell, User, Building2,
  DollarSign, ShieldCheck, ArrowRight, Sparkles, Cpu, Download, RefreshCw, ArrowLeft
} from 'lucide-react';

export default function InvestorDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyForAI, setSelectedPropertyForAI] = useState(null);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const fetchData = async () => {
    try {
      const res = await apiService.getProperties();
      if (res && res.properties) {
        setProperties(res.properties);
      }
    } catch (err) {
      console.error('Error fetching investor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardLayout user={user} onLogout={onLogout} activeTab={activeTab} onTabChange={handleTabChange}>
      
      {/* Universal Go Back Button when outside main overview */}
      {activeTab !== 'dashboard' && (
        <div className="mb-4">
          <button
            onClick={() => handleTabChange('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-extrabold transition-all border border-slate-200 cursor-pointer shadow-xs hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
            Back to Dashboard
          </button>
        </div>
      )}

      {/* ================= INVESTOR DASHBOARD OVERVIEW ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full text-xs font-bold text-purple-300 border border-purple-400/20">
                <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
                Institutional Investor Intelligence Hub
              </div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name || 'Investor'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Access market analytics, multi-year yield forecasts, and institutional property valuation reports.
              </p>
            </div>

            <button
              onClick={() => handleTabChange('analytics')}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <PieChart className="w-4 h-4" />
              View Market Analytics
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400">Tracked Assets</span>
              <strong className="text-2xl font-black text-slate-900 block">{properties.length}</strong>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-purple-600">Avg Rental Yield</span>
              <strong className="text-2xl font-black text-purple-600 block">5.8%</strong>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-600">Avg 5-Yr Growth</span>
              <strong className="text-2xl font-black text-emerald-600 block">+48.5%</strong>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-blue-600">Top Market</span>
              <strong className="text-2xl font-black text-blue-600 block">Bengaluru</strong>
            </div>
          </div>

          {/* Top Valued Assets Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-slate-900">Commercial Investment Opportunities</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                    <th className="py-3 px-2">Property</th>
                    <th className="py-3 px-2">City</th>
                    <th className="py-3 px-2">Listed Price</th>
                    <th className="py-3 px-2">Est. Market Value</th>
                    <th className="py-3 px-2">5-Yr Growth</th>
                    <th className="py-3 px-2">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-2 text-slate-600">{p.city}</td>
                      <td className="py-3 px-2 font-bold text-slate-800">₹{p.price} L</td>
                      <td className="py-3 px-2 font-bold text-purple-700">₹{p.predictedPrice || p.price} L</td>
                      <td className="py-3 px-2 text-emerald-700 font-extrabold">+46.2%</td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => navigate(`/property/${p.id}/valuation`)}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer text-[10px]"
                        >
                          Valuation Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= MARKET ANALYTICS TAB ================= */}
      {activeTab === 'analytics' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Commercial Market Analytics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Macro real estate growth indicators & institutional property data</p>
            </div>
            <button
              onClick={() => navigate('/ml-analytics')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Cpu className="w-4 h-4" />
              Open Model Analytics Suite
            </button>
          </div>
          <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2 text-xs">
            <strong className="text-purple-950 text-sm block">Market Growth Heatmap & City Metrics</strong>
            <p className="text-slate-700 leading-relaxed">
              Bengaluru tech corridors (Outer Ring Road, Whitefield, Electronic City, Sarjapur) lead commercial real estate capital appreciation with 9.2% annual rate and 5.4% average rental yield.
            </p>
          </div>
        </div>
      )}

      {/* ================= FUTURE PRICE FORECAST TAB ================= */}
      {activeTab === 'forecast' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-purple-600" />
            Future Price Forecast (Time-Series ARIMA & LSTM)
          </h2>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <strong className="text-slate-900 text-sm block">5-Year Growth Projections</strong>
            <p className="text-slate-600">LSTM Deep Learning models outperform standard ARIMA linear regressions with R² = 0.9680 across major metro markets.</p>
          </div>
        </div>
      )}

      {/* ================= ROI ANALYSIS TAB ================= */}
      {activeTab === 'roi' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            ROI & Rental Yield Analysis
          </h2>
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
            <strong className="text-emerald-950 text-sm block">Cap Rate & Return Matrix</strong>
            <p className="text-emerald-900">Commercial office parks present expected IRR of 14.5% over a 5-year investment horizon.</p>
          </div>
        </div>
      )}

      {/* ================= REPORTS TAB ================= */}
      {activeTab === 'ai-reports' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Institutional Market Reports
          </h2>
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs flex justify-between items-center">
            <div>
              <strong className="text-purple-900 block">Q3 Commercial Market Intelligence Report</strong>
              <p className="text-slate-600">Comprehensive overview of Bengaluru IT corridors, residential hubs, and micro-market trends.</p>
            </div>
            <button className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>
      )}

      {/* ================= SAVED REPORTS TAB ================= */}
      {activeTab === 'saved-reports' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-600" />
            Saved Institutional Reports
          </h2>
          <p className="text-xs text-slate-500">Your bookmarked property valuation reports and portfolio summaries.</p>
        </div>
      )}

      {/* ================= NOTIFICATIONS TAB ================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            Investor Alerts
          </h2>
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs">
            <strong className="text-purple-900 block">New Institutional Listing Added</strong>
            <p className="text-slate-700">Indiranagar Commercial Complex listed with 6.2% expected rental yield.</p>
          </div>
        </div>
      )}

      {/* ================= PROFILE TAB ================= */}
      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white font-bold text-2xl flex items-center justify-center">
              {user?.name ? user.name.charAt(0) : 'I'}
            </div>
            <div>
              <h2 className="font-heading text-xl font-extrabold text-slate-900">{user?.name || 'Investor'}</h2>
              <p className="text-xs text-slate-500">{user?.email || 'investor@apexrealty.com'}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <ShieldCheck className="w-3 h-3" />
                Verified Institutional Investor
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Valuation Modal */}
      {selectedPropertyForAI && (
        <AIPredictionModal
          property={selectedPropertyForAI}
          userRole="Investor"
          onClose={() => setSelectedPropertyForAI(null)}
        />
      )}

    </DashboardLayout>
  );
}
