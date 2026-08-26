import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import PropertyFilters from '../components/PropertyFilters';
import PropertyCard from '../components/PropertyCard';
import AIPredictionModal from '../components/AIPredictionModal';
import { apiService } from '../services/api';
import {
  Search, Cpu, Bookmark, History, Bell, User, Building2, MapPin, Sparkles,
  Gavel, ArrowRight, ShieldCheck, CheckCircle2, SlidersHorizontal, ArrowLeft
} from 'lucide-react';

export default function BuyerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [selectedPropertyForAI, setSelectedPropertyForAI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  // Pagination & Filtering State
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const [isRecommendation, setIsRecommendation] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const itemsPerPage = 12;

  // Direct AI Calculator Tab State
  const [calcForm, setCalcForm] = useState({
    city: 'Bangalore',
    bhk: '3',
    area_sqft: '1400',
    property_age: '3 yrs',
    amenities: 'Gym, Swimming Pool, Security',
    listed_price: '150'
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const buyerEmail = user ? user.email : 'buyer@apexrealty.com';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const fetchProperties = async (filtersToApply = activeFilters, pageToLoad = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const queryParams = {
        ...filtersToApply,
        page: pageToLoad,
        limit: itemsPerPage
      };
      const res = await apiService.getProperties(queryParams);
      if (res && res.properties) {
        const newProps = res.properties || [];
        const total = res.total || 0;

        if (append) {
          setProperties(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProps = newProps.filter(p => !existingIds.has(p.id));
            const combined = [...prev, ...uniqueNewProps];
            setFilteredProperties(combined);
            setHasMore(combined.length < total && newProps.length > 0);
            return combined;
          });
        } else {
          setProperties(newProps);
          setFilteredProperties(newProps);
          setHasMore(newProps.length < total && newProps.length > 0);
        }

        setTotalCount(total);
        setCurrentPage(pageToLoad);
        setIsRecommendation(res.isRecommendation || false);
        setRecommendationMessage(res.recommendationMessage || '');
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProperties(activeFilters, 1, false);
  }, []);

  const handleSearchFilters = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    fetchProperties(filters, 1, false);
  };

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = currentPage + 1;
          fetchProperties(activeFilters, nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, currentPage, activeFilters]);

  const handleToggleSave = (prop) => {
    if (savedProperties.some(p => p.id === prop.id)) {
      setSavedProperties(savedProperties.filter(p => p.id !== prop.id));
    } else {
      setSavedProperties([...savedProperties, prop]);
    }
  };

  const handleCalculateDirectValuation = async (e) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const mockProp = {
        name: `${calcForm.bhk} BHK in ${calcForm.city}`,
        city: calcForm.city,
        locality: 'Prime Location',
        price: parseFloat(calcForm.listed_price) || 150,
        bhk: parseInt(calcForm.bhk, 10) || 3,
        area: parseInt(calcForm.area_sqft, 10) || 1400,
        age: calcForm.property_age,
        amenities: calcForm.amenities.split(',').map(a => a.trim())
      };

      const valData = await apiService.predictValuation(mockProp);
      const geminiData = await apiService.getGeminiInsights(mockProp, valData, 'Buyer');

      setCalcResult({
        valuation: valData,
        insights: geminiData,
        property: mockProp
      });
    } catch (err) {
      console.error('Error calculating valuation:', err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} activeTab={activeTab} onTabChange={handleTabChange}>
      
      {/* Universal Go Back Button when outside main overview */}
      {activeTab !== 'dashboard' && (
        <div className="mb-4">
          <button
            onClick={() => handleTabChange('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-extrabold transition-all border border-slate-200 cursor-pointer shadow-xs hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            Back to Dashboard
          </button>
        </div>
      )}

      {/* ================= BUYER DASHBOARD OVERVIEW ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold text-blue-300 border border-blue-400/20">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Buyer Intelligence Portal
              </div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name || 'Buyer'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Explore real estate listings, access estimated market valuations, and participate in verified live auctions.
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => handleTabChange('search')}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Browse Properties
              </button>
              <button
                onClick={() => navigate('/auctions')}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Gavel className="w-4 h-4" />
                Live Auctions
              </button>
            </div>
          </div>

          {/* Search Filters Component */}
          <PropertyFilters onSearch={handleSearchFilters} />

          {/* Catalog Header & Count */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 px-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800">
                Showing {filteredProperties.length} of {totalCount} Properties
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Auto-loading as you scroll
            </div>
          </div>

          {/* Properties Grid */}
          <div className="space-y-6">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-bold">
                Loading property listings...
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
                No properties match your current search filters. Try clearing some criteria.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onViewDetails={(p) => navigate(`/property/${p.id}`)}
                      onAIPrediction={(p) => navigate(`/property/${p.id}/valuation`)}
                      onBidNow={(p) => navigate(`/auction/${p.id}/join`)}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Trigger & Loading Indicator */}
                <div ref={loadMoreRef} className="py-6 text-center">
                  {loadingMore && (
                    <div className="flex items-center justify-center gap-2.5 py-4 px-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xs mx-auto animate-pulse">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-700">Loading additional properties...</span>
                    </div>
                  )}
                  {!hasMore && filteredProperties.length > 0 && !loading && (
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-full border border-slate-200 text-xs font-bold text-slate-600 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Showing all {totalCount} properties</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* ================= SEARCH PROPERTIES TAB ================= */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h2 className="font-heading text-xl font-extrabold text-slate-900 mb-1">Search & Filter Real Estate</h2>
            <p className="text-xs text-slate-500 mb-4">Filter by city, budget, square footage, amenities, and BHK configuration</p>
            <PropertyFilters onSearch={handleSearchFilters} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 px-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800">
                Showing {filteredProperties.length} of {totalCount} Properties
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Auto-loading as you scroll
            </div>
          </div>

          {/* Smart Recommendation Notice Banner */}
          {isRecommendation && recommendationMessage && (
            <div className="bg-amber-50/90 border border-amber-200/90 text-amber-900 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-sm animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 fill-amber-500 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-heading font-extrabold text-sm text-amber-950">
                  {recommendationMessage}
                </h4>
                <p className="text-xs text-amber-800/90 font-medium">
                  No exact 100% matches were found for your filter combination. Our intelligent recommendation algorithm evaluated budget, area, BHK, and amenities to present the top closest matching properties ranked by similarity.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-bold">
                Loading property listings...
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
                No properties match your current search filters. Try clearing some criteria.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onViewDetails={(prop) => navigate(`/property/${prop.id}`)}
                      onAIPrediction={(prop) => navigate(`/property/${prop.id}/valuation`)}
                      onBidNow={(prop) => navigate(`/auction/${prop.id}/join`)}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Trigger & Loading Indicator */}
                <div ref={loadMoreRef} className="py-6 text-center">
                  {loadingMore && (
                    <div className="flex items-center justify-center gap-2.5 py-4 px-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xs mx-auto animate-pulse">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-700">Loading additional properties...</span>
                    </div>
                  )}
                  {!hasMore && filteredProperties.length > 0 && !loading && (
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-full border border-slate-200 text-xs font-bold text-slate-600 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Showing all {totalCount} properties</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= PROPERTY VALUATION ENGINE TAB ================= */}
      {activeTab === 'prediction' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Valuation Engine
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-slate-900">
                Property Valuation & Forecasting Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Calculate estimated market values and 5-year growth projections using Random Forest, XGBoost, ARIMA & LSTM algorithms.
              </p>
            </div>

            <form onSubmit={handleCalculateDirectValuation} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target City</label>
                <select
                  value={calcForm.city}
                  onChange={e => setCalcForm({ ...calcForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Bangalore">Bangalore (Bengaluru)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">BHK Configuration</label>
                <select
                  value={calcForm.bhk}
                  onChange={e => setCalcForm({ ...calcForm, bhk: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Super Built-up Area (Sq Ft)</label>
                <input
                  type="number"
                  value={calcForm.area_sqft}
                  onChange={e => setCalcForm({ ...calcForm, area_sqft: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Listed Price (₹ Lakhs)</label>
                <input
                  type="number"
                  value={calcForm.listed_price}
                  onChange={e => setCalcForm({ ...calcForm, listed_price: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={calculating}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {calculating ? 'Calculating Valuation Models...' : 'Generate Valuation Report'}
                </button>
              </div>
            </form>

            {/* Direct Result Output */}
            {calcResult && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 pt-4 border-t-2 border-blue-500">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading font-extrabold text-slate-900 text-sm">Valuation Summary</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                    Score: {calcResult.valuation?.investmentMetrics?.investmentScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Listed Price</span>
                    <strong className="text-base text-slate-800">₹{calcResult.property.price} L</strong>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Estimated Market Value</span>
                    <strong className="text-lg text-blue-700">₹{calcResult.valuation?.predictedPrice} L</strong>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="text-[10px] uppercase font-bold text-purple-600 block">5-Yr Forecast</span>
                    <strong className="text-lg text-purple-700">₹{calcResult.valuation?.forecastingModels?.lstm?.forecast5Yr} L</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                  {calcResult.insights?.priceRationale}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SAVED PROPERTIES TAB ================= */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h2 className="font-heading text-xl font-extrabold text-slate-900">Saved Properties ({savedProperties.length})</h2>
            <p className="text-xs text-slate-500">Bookmarks and shortlisted real estate offerings</p>
          </div>

          {savedProperties.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              You haven't saved any properties yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onViewDetails={prop => navigate(`/property/${prop.id}`)}
                  onAIPrediction={prop => navigate(`/property/${prop.id}/valuation`)}
                  onBidNow={prop => navigate(`/auction/${prop.id}/join`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= VALUATION HISTORY TAB ================= */}
      {activeTab === 'history' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Valuation History
          </h2>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <strong className="text-slate-900 text-sm block">Recent Valuation Reports</strong>
            <p className="text-slate-600">Calculated report logs and historical price projections generated during your browsing sessions.</p>
          </div>
        </div>
      )}

      {/* ================= NOTIFICATIONS TAB ================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Buyer Notifications
          </h2>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs">
            <strong className="text-blue-900 block">Auction Token Approved</strong>
            <p className="text-slate-700">Your registration pass for Indiranagar Heights has been approved by the seller.</p>
          </div>
        </div>
      )}

      {/* ================= PROFILE TAB ================= */}
      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center">
              {user?.name ? user.name.charAt(0) : 'B'}
            </div>
            <div>
              <h2 className="font-heading text-xl font-extrabold text-slate-900">{user?.name || 'Buyer'}</h2>
              <p className="text-xs text-slate-500">{user?.email || 'buyer@apexrealty.com'}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck className="w-3 h-3" />
                Verified Commercial Buyer
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Valuation Modal */}
      {selectedPropertyForAI && (
        <AIPredictionModal
          property={selectedPropertyForAI}
          userRole="Buyer"
          onClose={() => setSelectedPropertyForAI(null)}
        />
      )}

    </DashboardLayout>
  );
}
