import React, { useState, useEffect } from 'react';
import { X, Cpu, TrendingUp, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, PieChart, ArrowUpRight } from 'lucide-react';
import { apiService } from '../services/api';

export default function AIPredictionModal({ property, userRole = 'Buyer', onClose }) {
  const [loading, setLoading] = useState(true);
  const [valuation, setValuation] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    async function loadValuationAndInsights() {
      setLoading(true);
      try {
        const valData = await apiService.predictValuation(property);
        setValuation(valData);

        const geminiRes = await apiService.getGeminiInsights(property, valData, userRole);
        setInsights(geminiRes);
      } catch (err) {
        console.error('Error fetching valuation:', err);
      } finally {
        setLoading(false);
      }
    }

    if (property) {
      loadValuationAndInsights();
    }
  }, [property, userRole]);

  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-4 h-4" />
            Property Valuation & Market Intelligence Report
          </div>
          <h2 className="font-heading text-2xl font-bold">{property.name}</h2>
          <p className="text-slate-300 text-xs mt-1">{property.city} • Listed Price: ₹{property.price} Lakhs</p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-700">Calculating Property Valuation & Projections...</p>
              <p className="text-[11px] text-slate-400">Synthesizing market trend analytics...</p>
            </div>
          ) : (
            <>
              {/* 1. Current Price Valuation Comparison */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    Valuation Comparison (Regression Analysis)
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Primary Model: XGBoost (R² = 0.9635)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Listed Price</span>
                    <span className="font-heading text-lg font-bold text-slate-800">₹{property.price} L</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Random Forest Valuation</span>
                    <span className="font-heading text-lg font-bold text-slate-700">
                      ₹{valuation?.regressionModels?.randomForest?.predictedPrice} L
                    </span>
                    <span className="text-[9px] text-slate-400 block">MAE: ₹6.42 L</span>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Estimated Market Value</span>
                    <span className="font-heading text-xl font-extrabold text-blue-700">
                      ₹{valuation?.predictedPrice} L
                    </span>
                    <span className="text-[9px] text-blue-600 font-bold block">MAE: ₹5.18 L</span>
                  </div>
                </div>
              </div>

              {/* 2. Future Price Forecasting (ARIMA vs LSTM) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Future Price Forecast (Multi-Year Horizon)
                  </h3>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
                    Neural Model: LSTM (R² = 0.9680)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-200/60 font-bold text-slate-700">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Model</th>
                        <th className="p-2.5">1 Year</th>
                        <th className="p-2.5">3 Years</th>
                        <th className="p-2.5">5 Years</th>
                        <th className="p-2.5 rounded-r-lg">5-Yr Growth %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-bold text-slate-700">ARIMA Forecast</td>
                        <td className="p-2.5">₹{valuation?.forecastingModels?.arima?.forecast1Yr} L</td>
                        <td className="p-2.5">₹{valuation?.forecastingModels?.arima?.forecast3Yr} L</td>
                        <td className="p-2.5">₹{valuation?.forecastingModels?.arima?.forecast5Yr} L</td>
                        <td className="p-2.5 font-bold text-slate-700">+{valuation?.forecastingModels?.arima?.growth5YrPct}%</td>
                      </tr>
                      <tr className="bg-blue-50/70 font-bold text-blue-900">
                        <td className="p-2.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          LSTM Forecast
                        </td>
                        <td className="p-2.5">₹{valuation?.forecastingModels?.lstm?.forecast1Yr} L</td>
                        <td className="p-2.5">₹{valuation?.forecastingModels?.lstm?.forecast3Yr} L</td>
                        <td className="p-2.5 text-blue-700">₹{valuation?.forecastingModels?.lstm?.forecast5Yr} L</td>
                        <td className="p-2.5 text-emerald-700 font-extrabold">+{valuation?.forecastingModels?.lstm?.growth5YrPct}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Property Score</span>
                  <span className="font-heading text-xl font-extrabold text-emerald-700">
                    {valuation?.investmentMetrics?.investmentScore}/100
                  </span>
                </div>

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Expected ROI</span>
                  <span className="font-heading text-xl font-extrabold text-blue-700">
                    {valuation?.investmentMetrics?.expectedRoi}
                  </span>
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-center">
                  <span className="text-[10px] font-bold text-purple-800 uppercase block">Rental Yield</span>
                  <span className="font-heading text-xl font-extrabold text-purple-700">
                    {valuation?.investmentMetrics?.rentalYield}
                  </span>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">5-Yr Growth</span>
                  <span className="font-heading text-xl font-extrabold text-amber-700">
                    +{valuation?.investmentMetrics?.growth5YrPct}
                  </span>
                </div>
              </div>

              {/* 4. Market Insights */}
              {insights && (
                <div className="space-y-4 pt-2">
                  
                  {/* Recommendation Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    insights.recommendation === 'BUY'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : insights.recommendation === 'HOLD'
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-rose-500 text-white border-rose-600'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-80 block">
                        Market Recommendation
                      </span>
                      <span className="font-heading text-xl font-extrabold">{insights.recommendation} RECOMMENDATION</span>
                      <p className="text-xs opacity-90 mt-0.5">{insights.recommendationReason}</p>
                    </div>
                    <div className="text-3xl font-black opacity-20">
                      {insights.recommendation}
                    </div>
                  </div>

                  {/* Rationale & Market Trend */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Valuation Rationale
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{insights.priceRationale}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        Market Trend Analysis
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{insights.marketTrendAnalysis}</p>
                    </div>
                  </div>

                  {/* Advantages & Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                      <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Key Investment Advantages
                      </h4>
                      <ul className="space-y-1.5">
                        {(insights.advantages || []).map((adv, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                            {adv}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Risk Factors
                      </h4>
                      <ul className="space-y-1.5">
                        {(insights.risks || []).map((rk, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                            {rk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Investment Summary */}
                  <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Executive Summary ({userRole})
                    </h4>
                    <p className="text-xs text-blue-950 leading-relaxed">{insights.investmentSummary}</p>
                  </div>

                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
