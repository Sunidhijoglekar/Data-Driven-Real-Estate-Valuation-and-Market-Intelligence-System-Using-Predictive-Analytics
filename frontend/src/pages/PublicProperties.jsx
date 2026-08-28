import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import PropertyFilters from '../components/PropertyFilters';
import PropertyCard from '../components/PropertyCard';
import { apiService } from '../services/api';
import { Building2, Sparkles, LogIn, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

export default function PublicProperties({ user }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const catalogRef = useRef(null);
  const loadMoreRef = useRef(null);

  const [properties, setProperties] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  const [isRecommendation, setIsRecommendation] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState('');

  const itemsPerPage = 12;

  // Initialize filters from URL search params if present
  useEffect(() => {
    const urlCity = searchParams.get('city');
    const urlBhk = searchParams.get('bhk');
    const urlSearch = searchParams.get('search');
    
    const initialFilters = {};
    if (urlCity) initialFilters.city = urlCity;
    if (urlBhk) initialFilters.bhk = urlBhk;
    if (urlSearch) initialFilters.search = urlSearch;

    setActiveFilters(initialFilters);
    fetchCatalog(initialFilters, 1, false);
  }, []);

  const fetchCatalog = async (filtersToApply = activeFilters, pageToLoad = 1, append = false) => {
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
      const newProps = res.properties || [];
      const total = res.total || 0;

      if (append) {
        setProperties(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewProps = newProps.filter(p => !existingIds.has(p.id));
          const combined = [...prev, ...uniqueNewProps];
          setHasMore(combined.length < total && newProps.length > 0);
          return combined;
        });
      } else {
        setProperties(newProps);
        setHasMore(newProps.length < total && newProps.length > 0);
      }

      setTotalCount(total);
      setCurrentPage(pageToLoad);
      setIsRecommendation(res.isRecommendation || false);
      setRecommendationMessage(res.recommendationMessage || '');
    } catch (err) {
      console.error('Error fetching property catalog:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterSearch = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    fetchCatalog(filters, 1, false);
  };

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = currentPage + 1;
          fetchCatalog(activeFilters, nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, currentPage, activeFilters]);

  const handleViewDetails = (property) => {
    navigate(`/property/${property.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" ref={catalogRef}>
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold text-blue-300 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Complete Real Estate Catalog (1000+ Listings)
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            Browse All Verified Real Estate
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Explore our complete database of commercial offices, residential apartments, plots, and villas across major Indian cities.
          </p>
        </div>

        {!user && (
          <Link
            to="/login"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0"
          >
            <LogIn className="w-4 h-4" />
            Portal Login
          </Link>
        )}
      </div>

      {/* Property Filters Component */}
      <PropertyFilters onSearch={handleFilterSearch} />

      {/* Catalog Header Info Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 px-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-800">
            Showing {properties.length} of {totalCount} Properties
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

      {/* Property Grid */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading properties from dataset...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No properties match your filter criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your budget, city, or amenity filters to discover available properties in our 1000+ listing database.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={handleViewDetails}
                onAIPrediction={(p) => user ? navigate(`/property/${p.id}/valuation`) : navigate('/login')}
                onBidNow={(p) => user ? navigate(`/auction/${p.id}/join`) : navigate('/login')}
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
            {!hasMore && properties.length > 0 && !loading && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-full border border-slate-200 text-xs font-bold text-slate-600 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Showing all {totalCount} properties</span>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
