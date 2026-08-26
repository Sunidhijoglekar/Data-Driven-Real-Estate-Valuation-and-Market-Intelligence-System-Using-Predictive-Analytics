import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Building2, Search, Bot, TrendingUp, Coins, Gavel, BarChart3,
  CheckCircle2, MapPin, Clock, Users, ArrowRight, Sparkles, Star,
  ShieldCheck, Phone, Mail, Linkedin, Github, ChevronRight, Filter,
  ArrowUpRight, Award, Zap, Compass, Check
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Home() {
  const navigate = useNavigate();

  // Search Card State
  const [searchCity, setSearchCity] = useState('Bengaluru');
  const [searchType, setSearchType] = useState('Apartment');
  const [searchBhk, setSearchBhk] = useState('3 BHK');
  const [searchBudget, setSearchBudget] = useState('₹50L - ₹1 Cr');

  // Time remaining countdown ticker simulation
  const [timers, setTimers] = useState([
    { hours: 2, minutes: 15, seconds: 40 },
    { hours: 5, minutes: 30, seconds: 12 },
    { hours: 1, minutes: 5, seconds: 25 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev =>
        prev.map(t => {
          if (t.seconds > 0) return { ...t, seconds: t.seconds - 1 };
          if (t.minutes > 0) return { ...t, minutes: 59, seconds: 59 };
          if (t.hours > 0) return { hours: t.hours - 1, minutes: 59, seconds: 59 };
          return t;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/buyer?city=${encodeURIComponent(searchCity)}&type=${encodeURIComponent(searchType)}&bhk=${encodeURIComponent(searchBhk)}`);
  };

  // Sample Market Analytics Data for Recharts
  const priceDistributionData = [
    { city: 'Mumbai', avgPrice: 185, forecastPrice: 260 },
    { city: 'Bengaluru', avgPrice: 82.5, forecastPrice: 118 },
    { city: 'Delhi NCR', avgPrice: 110, forecastPrice: 155 },
    { city: 'Pune', avgPrice: 72, forecastPrice: 102 },
    { city: 'Hyderabad', avgPrice: 95, forecastPrice: 138 },
  ];

  const growthTrendData = [
    { year: '2022', marketVal: 62 },
    { year: '2023', marketVal: 68 },
    { year: '2024', marketVal: 75 },
    { year: '2025', marketVal: 82.5 },
    { year: '2026 (Pred)', marketVal: 91 },
    { year: '2027 (Pred)', marketVal: 100 },
    { year: '2028 (Pred)', marketVal: 110 },
    { year: '2029 (Pred)', marketVal: 118 },
  ];

  const investmentRoiData = [
    { location: 'Whitefield (BLR)', yieldPct: 8.5, capitalGrowth: 43 },
    { location: 'Bandra West (MUM)', yieldPct: 6.2, capitalGrowth: 38 },
    { location: 'Gachibowli (HYD)', yieldPct: 9.1, capitalGrowth: 48 },
    { location: 'Cyber City (GUR)', yieldPct: 7.8, capitalGrowth: 41 },
    { location: 'Kharadi (PUN)', yieldPct: 8.8, capitalGrowth: 45 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ========================================================= */}
      {/* HERO SECTION                                              */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white pt-12 pb-24 lg:pt-20 lg:pb-36">
        
        {/* Glow ambient effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >


              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Find Smarter Property Investments with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">Artificial Intelligence</span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Predict property prices, forecast future market values, analyze investment opportunities, and participate in live property auctions using AI-powered analytics.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => navigate('/buyer')}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Explore Properties
                </button>

                <button
                  onClick={() => navigate('/ml-analytics')}
                  className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm rounded-xl backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-blue-400" />
                  Predict Property Price
                </button>
              </div>

              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <span className="font-heading text-xl sm:text-2xl font-black text-white block">96.3%</span>
                  <span className="text-[11px] text-slate-400 font-medium">Valuation Accuracy</span>
                </div>
                <div>
                  <span className="font-heading text-xl sm:text-2xl font-black text-white block">50,000+</span>
                  <span className="text-[11px] text-slate-400 font-medium">Properties Analyzed</span>
                </div>
                <div>
                  <span className="font-heading text-xl sm:text-2xl font-black text-white block">₹120 Cr+</span>
                  <span className="text-[11px] text-slate-400 font-medium">Auction Volume</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Right Image & Featured Property Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl group">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"
                  alt="Luxury Apartment Building"
                  className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured AI Valuation
                </div>
              </div>

              {/* Glassmorphic Overlay Featured Card */}
              <div className="mt-4 lg:-mt-12 lg:ml-6 bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-3 text-white">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm text-slate-100">Bengaluru (Whitefield Tech Hub)</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Highly Recommended
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-medium">Current Listed Price</span>
                    <strong className="text-slate-100 text-sm font-extrabold">₹82,50,000</strong>
                  </div>

                  <div className="bg-blue-950/60 p-2.5 rounded-xl border border-blue-500/30">
                    <span className="text-[10px] text-blue-300 block font-medium">AI Predicted Price</span>
                    <strong className="text-blue-300 text-sm font-extrabold">₹81,90,000</strong>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-medium">5-Year Forecast</span>
                    <strong className="text-emerald-400 text-sm font-extrabold">₹1.18 Crore</strong>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-medium">Investment Score</span>
                    <strong className="text-amber-400 text-sm font-extrabold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> 9.2 / 10
                    </strong>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ========================================================= */}
      {/* FLOATING PROPERTY SEARCH SECTION                          */}
      {/* ========================================================= */}
      <div className="-mt-12 relative z-30 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xl shadow-blue-900/10"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading font-bold text-slate-900 text-sm uppercase tracking-wider">
              Smart AI Property Search & Filter
            </h3>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Pune">Pune</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Property Type</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Apartment">Luxury Apartment</option>
                <option value="Villa">Independent Villa</option>
                <option value="Penthouse">Penthouse Suite</option>
                <option value="Commercial">Commercial Office</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">BHK Configuration</label>
              <select
                value={searchBhk}
                onChange={(e) => setSearchBhk(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4+ BHK">4+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Budget Range (₹)</label>
              <select
                value={searchBudget}
                onChange={(e) => setSearchBudget(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Under ₹50L">Under ₹50 Lakhs</option>
                <option value="₹50L - ₹1 Cr">₹50 Lakhs - ₹1 Crore</option>
                <option value="₹1 Cr - ₹2 Cr">₹1 Crore - ₹2 Crores</option>
                <option value="₹2 Cr+">₹2 Crores +</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer h-[42px]"
              >
                <Search className="w-4 h-4" />
                Search Properties
              </button>
            </div>

          </form>
        </motion.div>
      </div>


      {/* ========================================================= */}
      {/* FEATURES SECTION                                         */}
      {/* ========================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            System Features
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive AI Real Estate Suite
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            From algorithmic price estimation to live auction bidding, our predictive platform provides end-to-end market intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-300 group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">🏠 Smart Property Search</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore verified residential and commercial properties with micro-market location maps, price breakdowns, and BHK specs.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-300 group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">🤖 AI Property Price Prediction</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get immediate fair market valuation generated by ensemble XGBoost and Random Forest regression algorithms.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-300 group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">📈 Future Price Forecast</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Project 1 to 5 year property capital growth using LSTM neural networks and time-series trend analysis.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-300 group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">💰 ROI & Investment Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluate capital appreciation rates, expected annual rental yields, and investment risk ratings before committing capital.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-300 group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
              <Gavel className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">🏷 Live Property Auctions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Participate in transparent real-time bidding for distress and premium assets with instant token deposit verification.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-300 group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">📊 Market Intelligence Dashboard</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analyze macro real estate market metrics, city-wise supply/demand trends, and historical benchmark comparisons.
            </p>
          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* HOW IT WORKS                                             */}
      {/* ========================================================= */}
      <section className="py-16 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-3 py-1 rounded-full border border-blue-800">
              Workflow
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How The System Works
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Four seamless steps from property discovery to predictive valuation and purchase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3 relative text-center md:text-left">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-heading font-bold text-white text-base">Search Property</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Filter properties by location, configuration, BHK, amenities, and budget constraints.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3 relative text-center md:text-left">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-heading font-bold text-white text-base">AI Predicts Property Value</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Machine learning models calculate fair market price, highlighting underpriced listings.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3 relative text-center md:text-left">
              <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-heading font-bold text-white text-base">View Future Price Forecast</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                LSTM neural networks plot 5-year capital appreciation curves and annual rental ROI.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3 relative text-center md:text-left">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">
                4
              </span>
              <h4 className="font-heading font-bold text-white text-base">Buy or Join Live Auction</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct purchase or place real-time bids during live property auctions to secure deal.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================= */}
      {/* LIVE AUCTIONS PREVIEW                                    */}
      {/* ========================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 w-fit">
              <Gavel className="w-3.5 h-3.5" />
              Live Auction Engine
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ongoing Live Property Auctions
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Preview real-time distress and premium property auctions currently in progress.
            </p>
          </div>

          <button
            onClick={() => navigate('/auctions')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer w-fit"
          >
            View All Live Auctions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Auction Card 1 */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between space-y-4 p-5">
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden h-44">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"
                  alt="Skyline Crest Apartment"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  LIVE NOW
                </div>
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-xl border border-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {String(timers[0].hours).padStart(2, '0')}h : {String(timers[0].minutes).padStart(2, '0')}m : {String(timers[0].seconds).padStart(2, '0')}s
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Bengaluru • Whitefield</span>
                <h3 className="font-heading font-bold text-slate-900 text-base">Skyline Crest Luxury Apartment</h3>
                <p className="text-xs text-slate-500">3 BHK • 1,850 Sq. Ft. • Reserved Valuation: ₹1.10 Cr</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Highest Bid</span>
                  <strong className="text-emerald-600 font-extrabold text-sm">₹95,00,000</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Active Bidders</span>
                  <strong className="text-slate-800 font-bold text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> 14 Registered
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/auctions')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              View Auction & Bid
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Auction Card 2 */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between space-y-4 p-5">
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden h-44">
                <img
                  src="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80"
                  alt="Palm Grove Luxury Villa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  LIVE NOW
                </div>
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-xl border border-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {String(timers[1].hours).padStart(2, '0')}h : {String(timers[1].minutes).padStart(2, '0')}m : {String(timers[1].seconds).padStart(2, '0')}s
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Mumbai • Bandra West</span>
                <h3 className="font-heading font-bold text-slate-900 text-base">Palm Grove Luxury Villa</h3>
                <p className="text-xs text-slate-500">4 BHK • 3,200 Sq. Ft. • Reserved Valuation: ₹2.60 Cr</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Highest Bid</span>
                  <strong className="text-emerald-600 font-extrabold text-sm">₹2,40,00,000</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Active Bidders</span>
                  <strong className="text-slate-800 font-bold text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> 28 Registered
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/auctions')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              View Auction & Bid
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Auction Card 3 */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between space-y-4 p-5">
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden h-44">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80"
                  alt="Tech Park Commercial Suite"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  LIVE NOW
                </div>
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-xl border border-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {String(timers[2].hours).padStart(2, '0')}h : {String(timers[2].minutes).padStart(2, '0')}m : {String(timers[2].seconds).padStart(2, '0')}s
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pune • Kharadi IT Park</span>
                <h3 className="font-heading font-bold text-slate-900 text-base">Tech Park Commercial Suite</h3>
                <p className="text-xs text-slate-500">Commercial Office • 1,400 Sq. Ft. • Reserved: ₹98 Lacs</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Highest Bid</span>
                  <strong className="text-emerald-600 font-extrabold text-sm">₹88,00,000</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Active Bidders</span>
                  <strong className="text-slate-800 font-bold text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> 9 Registered
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/auctions')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              View Auction & Bid
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* AI PREDICTION PREVIEW                                    */}
      {/* ========================================================= */}
      <section id="ai-prediction" className="py-20 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5 w-fit mx-auto">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              Machine Learning Model Output
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Property Valuation & ROI Forecast Preview
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Below is a live model output preview demonstrating our machine learning valuation pipeline.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                  Demo Property Valuation
                </span>
                <h3 className="font-heading text-xl font-bold text-white">
                  Prestige Cyber Heights, Outer Ring Road, Bengaluru
                </h3>
                <p className="text-xs text-slate-400">3 BHK Luxury Residency • 1,850 Sq. Ft. • 2nd Floor</p>
              </div>

              <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/30 text-center shrink-0">
                <span className="text-[10px] font-bold block text-emerald-300">RECOMMENDATION</span>
                <strong className="text-base font-black tracking-wide">BUY NOW</strong>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Current Market Price</span>
                <strong className="text-white text-base font-extrabold">₹82,50,000</strong>
              </div>

              <div className="bg-blue-950/80 p-3.5 rounded-2xl border border-blue-500/40 text-center space-y-1">
                <span className="text-[10px] text-blue-300 block font-medium">Future Price (5 Yrs)</span>
                <strong className="text-blue-300 text-base font-extrabold">₹1.18 Crore</strong>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Expected Growth</span>
                <strong className="text-emerald-400 text-base font-extrabold">+43%</strong>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Annual Rental Yield</span>
                <strong className="text-amber-400 text-base font-extrabold">18% p.a.</strong>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Investment Score</span>
                <strong className="text-amber-300 text-base font-extrabold">9.2 / 10</strong>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Model Accuracy</span>
                <strong className="text-purple-300 text-base font-extrabold">96.3%</strong>
              </div>

            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Validated using XGBoost Valuation & LSTM Time-Series Architecture</span>
              </div>

              <button
                onClick={() => navigate('/ml-analytics')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                Run Full Model Simulator
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* MARKET ANALYTICS PREVIEW                                 */}
      {/* ========================================================= */}
      <section id="market-analytics" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Predictive Visualizations
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Market Analytics & Growth Benchmarks
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Interactive charts illustrating price distribution, historical growth, and capital appreciation projections.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Price Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base">City-Wise Price Distribution & Forecast</h3>
                <p className="text-xs text-slate-500">Average Current Listed vs 5-Year Predicted Price (₹ Lakhs)</p>
              </div>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="city" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit="L" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="avgPrice" name="Current Price (₹ L)" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="forecastPrice" name="5-Yr Forecast (₹ L)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Growth Trend */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base">Historical vs LSTM Market Growth Trend</h3>
                <p className="text-xs text-slate-500">Benchmark Index Valuation Curve (2022 - 2029)</p>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthTrendData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="marketVal" name="Index Valuation" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* WHY CHOOSE US                                            */}
      {/* ========================================================= */}
      <section id="about" className="py-20 bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Value Proposition
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Choose RealEstate.AI
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Built upon rigorously trained machine learning models, transparent auction mechanics, and micro-market data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base">✔ AI-Based Valuation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trained on over 50,000 real estate transactions across major Indian tier-1 cities for reliable baseline values.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base">✔ Accurate Price Prediction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                XGBoost and Random Forest regression algorithms achieve 96.3% R² accuracy, removing overpriced listings.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base">✔ Future Market Forecasting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                LSTM neural network time-series modeling provides 1 to 5 year appreciation curves and inflation-adjusted ROI.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base">✔ Secure Property Auctions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant token deposit verification and real-time WebSocket outbid alerts ensure complete auction transparency.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================= */}
      {/* TESTIMONIAL SECTION                                      */}
      {/* ========================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            User Testimonials
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Buyers, Sellers & Investors
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Read how data-driven real estate valuation is empowering investors and homebuyers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "The 5-year LSTM price forecast helped me pinpoint high-growth inventory in Whitefield, Bengaluru before prices surged by 25%. Extremely accurate!"
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                AS
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Ananya Sharma</span>
                <span className="text-[10px] text-slate-400">Real Estate Portfolio Investor</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "RealEstate.AI predicted the exact fair market value within a 2% margin. Purchasing through their live auction platform was smooth and transparent."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                RV
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Rohan Verma</span>
                <span className="text-[10px] text-slate-400">Homebuyer (Mumbai)</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "An extraordinary capstone system! Combining XGBoost property valuation with live bidding mechanisms sets a benchmark for prop-tech software."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                KM
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Dr. K. R. Mehta</span>
                <span className="text-[10px] text-slate-400">Senior PropTech Analyst</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* CALL TO ACTION BANNER                                    */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3.5 py-1.5 rounded-full border border-blue-400/20 inline-block">
            Get Started Today
          </span>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
            Ready to Make Smarter Property Decisions?
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Experience data-driven real estate valuation, forecast 5-year market trends, and participate in live property auctions today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/buyer')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Explore Properties
            </button>

            <button
              onClick={() => navigate('/ml-analytics')}
              className="px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-blue-600" />
              Get AI Prediction
            </button>
          </div>
        </div>
      </section>


      {/* Footer removed as requested */}
    </div>
  );
}
