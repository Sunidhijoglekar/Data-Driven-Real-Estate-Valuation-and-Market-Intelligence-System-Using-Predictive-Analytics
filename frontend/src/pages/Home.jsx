import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import PropertyCard from '../components/PropertyCard';
import { apiService } from '../services/api';
import {
  Building2, Search, TrendingUp, Coins, Gavel, BarChart3,
  CheckCircle2, MapPin, Clock, Users, ArrowRight, Sparkles, Star,
  ShieldCheck, Filter, ArrowUpRight
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

  // Featured properties preview state
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await apiService.getProperties({ featured: 'true' });
        setFeaturedProperties(res.properties || []);
      } catch (err) {
        console.error('Failed to load featured properties:', err);
      } finally {
        setFeaturedLoading(false);
      }
    };
    loadFeatured();
  }, []);

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
    navigate(`/properties?city=${encodeURIComponent(searchCity)}&type=${encodeURIComponent(searchType)}&bhk=${encodeURIComponent(searchBhk)}`);
  };

  // Sample Market Analytics Data for Bangalore Micro-Markets Recharts
  const priceDistributionData = [
    { city: 'Indiranagar', avgPrice: 145, forecastPrice: 195 },
    { city: 'Koramangala', avgPrice: 135, forecastPrice: 180 },
    { city: 'Whitefield', avgPrice: 92, forecastPrice: 130 },
    { city: 'HSR Layout', avgPrice: 110, forecastPrice: 152 },
    { city: 'Electronic City', avgPrice: 65, forecastPrice: 95 },
  ];

  const growthTrendData = [
    { year: '2022', marketVal: 62 },
    { year: '2023', marketVal: 68 },
    { year: '2024', marketVal: 75 },
    { year: '2025', marketVal: 82.5 },
    { year: '2026 (Now)', marketVal: 91 },
    { year: '2027 (Pred)', marketVal: 100 },
    { year: '2028 (Pred)', marketVal: 110 },
    { year: '2029 (Pred)', marketVal: 121 },
    { year: '2030 (Pred)', marketVal: 132 },
    { year: '2031 (Pred)', marketVal: 144 },
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
                Real Estate Portal
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Predict property valuations, forecast future market prices, analyze investment yields, and participate in live real estate auctions using advanced market analytics algorithms.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => navigate('/properties')}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Explore Properties
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm rounded-xl backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Property Valuation
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
                  alt="Commercial Property"
                  className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Market Valuation
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
                    <span className="text-[10px] text-blue-300 block font-medium">Estimated Market Value</span>
                    <strong className="text-blue-300 text-sm font-extrabold">₹81,90,000</strong>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-medium">5-Year Forecast</span>
                    <strong className="text-emerald-400 text-sm font-extrabold">₹1.18 Crore</strong>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-medium">Property Score</span>
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

      {/* SEARCH SECTION */}
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
              Search & Filter Properties
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
                <option value="Bangalore">Bangalore (Bengaluru)</option>
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

      {/* FEATURED PROPERTIES HOMEPAGE PREVIEW */}
      <section className="pt-16 pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Homepage Preview
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Real Estate Listings
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Featured selections from our complete 1000+ property database across major Indian cities.
            </p>
          </div>

          <button
            onClick={() => navigate('/properties')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shrink-0"
          >
            <Building2 className="w-4 h-4" />
            Browse All Properties
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredLoading ? (
          <div className="text-center py-12 text-xs font-bold text-slate-400">
            Loading featured properties...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={(p) => navigate(`/property/${p.id}`)}
                onAIPrediction={(p) => navigate(`/property/${p.id}/valuation`)}
                onBidNow={(p) => navigate(`/auction/${p.id}/join`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Platform Capabilities
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Commercial Real Estate Intelligence Platform
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            From algorithmic price estimation to live auction bidding, our predictive platform provides end-to-end market intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">Verified Property Search</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore verified residential and commercial properties with micro-market location maps, price breakdowns, and BHK specs.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">Property Valuation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get immediate fair market valuation generated by ensemble regression algorithms.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">Future Price Forecast</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Project 1 to 5 year property capital growth using neural networks and time-series trend analysis.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">ROI & Yield Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluate capital appreciation rates, expected annual rental yields, and investment risk ratings.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Gavel className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">Live Property Auctions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Participate in transparent real-time bidding for commercial and distress assets with deposit verification.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">Market Analytics Dashboard</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analyze macro real estate market metrics, city-wise supply/demand trends, and historical benchmark comparisons.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
