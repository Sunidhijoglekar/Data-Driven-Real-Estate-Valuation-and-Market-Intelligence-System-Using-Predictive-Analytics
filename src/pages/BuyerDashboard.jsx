import React, { useState, useEffect } from 'react';
import PropertyFilters from '../components/PropertyFilters';
import PropertyCard from '../components/PropertyCard';
import AIPredictionModal from '../components/AIPredictionModal';
import { apiService } from '../services/api';
import { Building2, Sparkles, SlidersHorizontal, Search, Trophy, Gavel, Flame, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BuyerDashboard({ user }) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedPropForPrediction, setSelectedPropForPrediction] = useState(null);

  const fetchPropertiesData = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await apiService.getProperties(filters);
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertiesData();
  }, []);

  const handleViewDetails = (property) => {
    navigate(`/property/${property.id}`);
  };

  const handleAIPrediction = (property) => {
    setSelectedPropForPrediction(property);
  };

  const handleBidNow = (property) => {
    navigate(`/auction/${property.id}/join`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Buyer Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Predictive AI Property Finder & Live Bidding
          </div>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            Find Your Ideal Home with AI Valuations & Match Scores
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Search listings, compare XGBoost valuation estimates against seller prices, project 5-year LSTM market appreciation, and participate in live auctions.
          </p>
        </div>

        {/* Live Auctions Quick Action Card */}
        <div 
          onClick={() => navigate('/auctions')}
          className="relative z-10 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] w-full md:w-80 group shadow-lg shrink-0"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
              <Gavel className="w-5 h-5 animate-pulse" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-400/20">
              <Flame className="w-3 h-3 text-amber-400" />
              Live Arena
            </span>
          </div>

          <h2 className="font-heading text-lg font-extrabold text-white group-hover:text-amber-200 transition-colors flex items-center justify-between">
            Live Auctions
            <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
          </h2>
          <p className="text-xs text-blue-100/80 mt-1 line-clamp-2">
            Explore currently active real estate auctions, view live bids, and join bidding rounds.
          </p>
        </div>
      </div>

      {/* Quick Option Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Live Auctions Feature Card */}
        <div 
          onClick={() => navigate('/auctions')}
          className="bg-gradient-to-br from-blue-50 to-indigo-50/50 hover:from-blue-100/60 hover:to-indigo-100/60 border border-blue-200/80 rounded-2xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-md flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                  Live Auctions
                </h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">Active</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Participate in real-time digital property bidding
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </div>

        {/* My Auctions Portal Card */}
        <div 
          onClick={() => navigate('/my-auctions')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-md flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                Auction Passes & History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage token registrations & track your bids
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </div>

        {/* AI Valuation Finder Card */}
        <div 
          onClick={() => {
            const filterElement = document.getElementById('property-filters-container');
            if (filterElement) filterElement.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white hover:bg-slate-50/80 border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-md flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                AI Match & Valuations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                XGBoost pricing & 5-Yr LSTM appreciation
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </div>

      </div>

      {/* Property Filters Component */}
      <PropertyFilters onSearch={fetchPropertiesData} />

      {/* Property Results Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Matched Properties ({properties.length})
          </h2>
          <p className="text-xs text-slate-500">Ranked by AI match score & feature criteria</p>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Searching property dataset with ML valuation models...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 p-8">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-slate-800 text-base">No Matching Properties Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your amenity filters, expanding your budget or area range slider, or clearing city filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onViewDetails={handleViewDetails}
              onAIPrediction={handleAIPrediction}
              onBidNow={handleBidNow}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedPropForPrediction && (
        <AIPredictionModal
          property={selectedPropForPrediction}
          userRole="Buyer"
          onClose={() => setSelectedPropForPrediction(null)}
        />
      )}

    </div>
  );
}
