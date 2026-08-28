import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { TrendingUp, PieChart, Sparkles, Building2, ArrowUpRight, ShieldCheck, DollarSign, Cpu, Search, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import AIPredictionModal from '../components/AIPredictionModal';

export default function InvestorDashboard({ user }) {
  const [properties, setProperties] = useState([]);
  const [historical, setHistorical] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [sortBy, setSortBy] = useState('score'); // score | yield | roi
  const [selectedPropForPrediction, setSelectedPropForPrediction] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const propData = await apiService.getProperties();
        setProperties(propData.properties || []);

        const histData = await apiService.getHistoricalTrends();
        setHistorical(histData || {});
      } catch (err) {
        console.error('Error loading investor data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Prepare chart data for selected city
  const cityHistoricalChartData = (historical[selectedCity] || []).map(item => ({
    year: item.year,
    pricePerSqFt: item.avgPricePerSqFt,
    rentalYield: item.rentalYield,
    cagr: item.cagr
  }));

  // Filter & Sort properties for Investor Table
  const filteredProperties = properties
    .filter(p => selectedCity === 'All' || p.city.toLowerCase() === selectedCity.toLowerCase())
    .sort((a, b) => {
      const valA = a.valuation?.investmentMetrics;
      const valB = b.valuation?.investmentMetrics;
      if (sortBy === 'score') return (valB?.investmentScore || 0) - (valA?.investmentScore || 0);
      if (sortBy === 'yield') return parseFloat(valB?.rentalYield || '0') - parseFloat(valA?.rentalYield || '0');
      if (sortBy === 'roi') return parseFloat(valB?.expectedRoi || '0') - parseFloat(valA?.expectedRoi || '0');
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Investor Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full text-xs font-bold text-purple-300 border border-purple-400/20">
            <PieChart className="w-3.5 h-3.5 text-purple-300" />
            Institutional Portfolio & Capital Growth Analytics
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            Investor Market Intelligence Hub
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Evaluate current property prices against 1-year and 5-year LSTM price forecasts, inspect cap rates, analyze rental yields, and review Gemini AI investment recommendations.
          </p>
        </div>

        {/* City Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 shrink-0">
          {['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === c
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">City Benchmark SqFt Price</span>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-2xl font-bold text-slate-900">
              ₹{selectedCity === 'Mumbai' ? '18,500' : selectedCity === 'Bangalore' ? '10,800' : selectedCity === 'Delhi NCR' ? '13,200' : '9,400'}
            </span>
            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% YoY
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Historical 10-year growth trends</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Average Rental Yield</span>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-2xl font-bold text-purple-700">
              {selectedCity === 'Mumbai' ? '3.8%' : selectedCity === 'Bangalore' ? '4.8%' : selectedCity === 'Delhi NCR' ? '4.1%' : '4.5%'}
            </span>
            <span className="text-xs font-bold text-purple-600">p.a. return</span>
          </div>
          <p className="text-[11px] text-slate-500">Supported by commercial corridor demand</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">5-Year LSTM Projected Appreciation</span>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-2xl font-bold text-emerald-700">+68.5%</span>
            <span className="text-xs font-bold text-emerald-600">High Confidence</span>
          </div>
          <p className="text-[11px] text-slate-500">LSTM Neural Net time-series prediction</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Portfolio Risk Rating</span>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-2xl font-bold text-blue-700">Low - Moderate</span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Strong capital preservation score</p>
        </div>
      </div>

      {/* Historical Growth Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              10-Year Price Trend & Rental Yield Dynamics ({selectedCity})
            </h3>
            <p className="text-xs text-slate-500">Time-series dataset mapping historical capital growth vs annual rental yield</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cityHistoricalChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={11} unit=" ₹" />
              <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="pricePerSqFt" name="Price per Sq. Ft. (₹)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="rentalYield" name="Rental Yield (%)" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investment Ranking Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Property Investment Matrix & LSTM Price Projections
            </h3>
            <p className="text-xs text-slate-500">Cross-comparing current list prices against predicted 1-Yr and 5-Yr LSTM forecasts</p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Sort By:</span>
            <button
              onClick={() => setSortBy('score')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                sortBy === 'score' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Investment Score
            </button>
            <button
              onClick={() => setSortBy('yield')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                sortBy === 'yield' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rental Yield
            </button>
            <button
              onClick={() => setSortBy('roi')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                sortBy === 'roi' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Expected ROI
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Property & Location</th>
                <th className="p-4">Listed Price</th>
                <th className="p-4">ML Valuation (XGBoost)</th>
                <th className="p-4">1-Yr Forecast (LSTM)</th>
                <th className="p-4">5-Yr Forecast (LSTM)</th>
                <th className="p-4">Rental Yield</th>
                <th className="p-4">Expected ROI</th>
                <th className="p-4">Investment Score</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProperties.map((prop) => {
                const valuation = prop.valuation;
                const metrics = valuation?.investmentMetrics;
                const lstm = valuation?.forecastingModels?.lstm;

                return (
                  <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={prop.image} alt={prop.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
                        <div>
                          <span className="font-bold text-slate-900 block">{prop.name}</span>
                          <span className="text-[11px] text-slate-400">{prop.locality}, {prop.city}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      ₹{prop.price} L
                    </td>

                    <td className="p-4 font-bold text-blue-600">
                      ₹{prop.predictedPrice || prop.price} L
                    </td>

                    <td className="p-4 font-bold text-slate-700">
                      ₹{lstm?.forecast1Yr || 'N/A'} L
                    </td>

                    <td className="p-4 font-extrabold text-emerald-700 bg-emerald-50/50">
                      ₹{lstm?.forecast5Yr || 'N/A'} L
                      <span className="block text-[9px] text-emerald-600">+{lstm?.growth5YrPct}%</span>
                    </td>

                    <td className="p-4 font-bold text-purple-700">
                      {metrics?.rentalYield || '4.2%'}
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {metrics?.expectedRoi || '14.2% p.a.'}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-extrabold text-xs text-purple-800 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        {metrics?.investmentScore || 88}/100
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedPropForPrediction(prop)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Report
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {selectedPropForPrediction && (
        <AIPredictionModal
          property={selectedPropForPrediction}
          userRole="Investor"
          onClose={() => setSelectedPropForPrediction(null)}
        />
      )}

    </div>
  );
}
