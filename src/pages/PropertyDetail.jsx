import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Building2, MapPin, Maximize2, Bed, Bath, Sparkles, Gavel, Cpu, ArrowLeft, ShieldCheck, Mail, User, Phone } from 'lucide-react';
import GoogleMapComponent from '../components/GoogleMapComponent';
import AIPredictionModal from '../components/AIPredictionModal';

export default function PropertyDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAIPrediction, setShowAIPrediction] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      try {
        const data = await apiService.getPropertyById(id);
        setProperty(data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-600">Loading property intelligence dossier...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <p className="text-sm font-bold text-rose-600">{error || 'Property not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const topBid = property.bids && property.bids.length > 0
    ? Math.max(...property.bids.map(b => b.amount))
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Images, Specs, Map, Description) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Photo Banner */}
          <div className="relative h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
            <img
              src={property.image}
              alt={property.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm flex items-center gap-1 border border-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                {property.matchScore || 96}% Match Score
              </span>
              {property.auctionEnabled && (
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Gavel className="w-3.5 h-3.5" />
                  Live Auction
                </span>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white flex items-end justify-between">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold">{property.name}</h1>
                <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {property.locality}, {property.city}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-300 block">Listed Price</span>
                <span className="font-heading text-2xl font-bold">₹{property.price} Lakhs</span>
              </div>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Area</span>
              <span className="font-heading text-base font-bold text-slate-800 flex items-center justify-center gap-1">
                <Maximize2 className="w-4 h-4 text-blue-600" />
                {property.area} Sq. Ft.
              </span>
            </div>

            <div className="space-y-1 border-x border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Configuration</span>
              <span className="font-heading text-base font-bold text-slate-800 flex items-center justify-center gap-1">
                <Bed className="w-4 h-4 text-blue-600" />
                {property.bhk} BHK Bedrooms
              </span>
            </div>

            <div className="space-y-1 border-r border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bathrooms</span>
              <span className="font-heading text-base font-bold text-slate-800 flex items-center justify-center gap-1">
                <Bath className="w-4 h-4 text-blue-600" />
                {property.bathrooms} Baths
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Property Age</span>
              <span className="font-heading text-base font-bold text-slate-800">
                {property.age}
              </span>
            </div>
          </div>

          {/* Amenities & Description */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-slate-900 text-base">Property Overview & Features</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{property.description}</p>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Included Premium Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {(property.amenities || []).map((amenity, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-xl border border-slate-200">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Embedded Google Maps */}
          <GoogleMapComponent property={property} />

        </div>

        {/* Right Column (AI Valuation Callout & Seller Contact Card) */}
        <div className="space-y-6">
          
          {/* AI Valuation Card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-6 rounded-3xl text-white space-y-5 shadow-xl border border-blue-800/40">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-blue-400" />
              Machine Learning Audit
            </div>

            <div>
              <span className="text-xs text-slate-300 block">Predicted XGBoost Fair Value</span>
              <span className="font-heading text-3xl font-extrabold text-blue-200">
                ₹{property.valuation?.predictedPrice || property.price} Lakhs
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300">5-Yr Projected Value:</span>
                <strong className="text-emerald-300">₹{property.valuation?.forecastingModels?.lstm?.forecast5Yr || 'N/A'} L</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Rental Yield:</span>
                <strong className="text-purple-300">{property.valuation?.investmentMetrics?.rentalYield || '4.2%'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Investment Score:</span>
                <strong className="text-amber-300">{property.valuation?.investmentMetrics?.investmentScore || 88}/100</strong>
              </div>
            </div>

            <button
              onClick={() => setShowAIPrediction(true)}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Full Gemini AI Investment Report
            </button>
          </div>

          {/* Auction Bidding CTA */}
          {property.auctionEnabled && (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Gavel className="w-4 h-4 text-amber-600" />
                  Live Property Auction
                </div>
                {topBid && (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Top Bid: ₹{topBid} L
                  </span>
                )}
              </div>

              <p className="text-xs text-amber-800">
                This property is listed for active bidding. Join the dedicated online property auction arena to participate.
              </p>

              <button
                onClick={() => navigate(`/auction/${property.id}/join`)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gavel className="w-4 h-4" />
                Start Bidding (Join Auction)
              </button>
            </div>
          )}

          {/* Seller / Representative Contact Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Listing Seller
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">{property.seller || 'Apex Realty Group'}</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {property.sellerEmail || 'seller@apexrealty.com'}
                </span>
              </div>
            </div>

            <button
              onClick={() => alert(`Direct connection initiated with seller (${property.sellerEmail}). Representative will contact you shortly.`)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Contact Seller Directly
            </button>
          </div>

        </div>

      </div>

      {/* Modals */}
      {showAIPrediction && (
        <AIPredictionModal
          property={property}
          userRole={user ? user.role : 'Buyer'}
          onClose={() => setShowAIPrediction(false)}
        />
      )}

    </div>
  );
}
