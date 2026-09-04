import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Building2, MapPin, Maximize2, Bed, Bath, Gavel, ArrowLeft,
  ShieldCheck, Mail, User, CheckCircle2, Car, Compass, Layers, Calendar
} from 'lucide-react';
import GoogleMapComponent from '../components/GoogleMapComponent';
import PropertyCard from '../components/PropertyCard';
import PropertyMarketGrowthChart from '../components/PropertyMarketGrowthChart';

export default function PropertyDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [valuation, setValuation] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPropertyAndSimilar() {
      setLoading(true);
      try {
        const data = await apiService.getPropertyById(id);
        setProperty(data);

        // Asynchronously fetch ML valuation & market growth
        apiService.predictValuation(data)
          .then(res => setValuation(res))
          .catch(err => console.warn('Valuation notice:', err.message));

        // Fetch all properties to find similar properties
        const res = await apiService.getProperties();
        if (res && res.properties) {
          const filtered = res.properties.filter(p =>
            String(p.id) !== String(id) && (p.city === data.city || p.type === data.type)
          ).slice(0, 3);
          setSimilarProperties(filtered);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    }
    loadPropertyAndSimilar();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-600">Loading property information...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <p className="text-sm font-bold text-rose-600">{error || 'Property not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Navigation Bar & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          Back
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(`/property/${property.id}/valuation`)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Property Valuation
          </button>

          {property.auctionEnabled && (
            <button
              onClick={() => navigate(`/auction/${property.id}/join`)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              Start Bidding
            </button>
          )}
        </div>
      </div>

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
              <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-800 shadow-sm border border-blue-100">
                {property.type || 'Commercial Asset'}
              </span>
              {property.auctionEnabled && (
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Gavel className="w-3.5 h-3.5" />
                  Live Bidding Event
                </span>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white flex items-end justify-between">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold">{property.name}</h1>
                <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {property.locality ? `${property.locality}, ${property.city}` : property.city}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-300 block">Current Selling Price</span>
                <span className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  ₹{property.price} Lakhs
                </span>
              </div>
            </div>
          </div>

          {/* Key Property Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Property Type</span>
              <span className="font-heading text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <Building2 className="w-4 h-4 text-blue-600" />
                {property.type || 'Apartment'}
              </span>
            </div>

            <div className="space-y-1 border-x border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Super Built-up Area</span>
              <span className="font-heading text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <Maximize2 className="w-4 h-4 text-blue-600" />
                {property.area_sqft || property.area || 1500} Sq. Ft.
              </span>
            </div>

            <div className="space-y-1 border-r border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Configuration</span>
              <span className="font-heading text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <Bed className="w-4 h-4 text-blue-600" />
                {property.bhk} BHK
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bathrooms</span>
              <span className="font-heading text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <Bath className="w-4 h-4 text-blue-600" />
                {property.bathrooms || 2} Baths
              </span>
            </div>
          </div>

          {/* Detailed Specifications Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-slate-900 text-base">Property Specifications</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Property Age</span>
                <strong className="text-slate-800 text-xs font-bold mt-0.5 block">{property.age || property.property_age || '1-3 Yrs'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Furnishing Status</span>
                <strong className="text-slate-800 text-xs font-bold mt-0.5 block">{property.furnishing || 'Semi-Furnished'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Parking</span>
                <strong className="text-slate-800 text-xs font-bold mt-0.5 block">{property.parking || 'Covered Reserved Slot'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Builder / Developer</span>
                <strong className="text-slate-800 text-xs font-bold mt-0.5 block">{property.builder || 'Prestige Group Builders'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Construction Status</span>
                <strong className="text-emerald-700 text-xs font-bold mt-0.5 block">{property.constructionStatus || 'Ready to Move'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Price Per Sq. Ft.</span>
                <strong className="text-slate-800 text-xs font-bold mt-0.5 block">
                  ₹{Math.round(((property.price * 100000) / (property.area_sqft || property.area || 1500)))} / sqft
                </strong>
              </div>
            </div>
          </div>

          {/* Amenities & Description */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-slate-900 text-base">Property Description & Features</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{property.description || 'Premium commercial and residential property offering strategic road access, modern security systems, power backup, and top-tier interior design.'}</p>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Property Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {(property.amenities || ['Swimming Pool', 'Gymnasium', '24/7 Security', 'Clubhouse', 'Power Backup', 'Covered Parking']).map((amenity, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1 rounded-xl border border-blue-200">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Embedded Google Maps */}
          <GoogleMapComponent property={property} />

          {/* Year-by-Year Property Market Appreciation Graph */}
          <PropertyMarketGrowthChart property={property} valuation={valuation} />

        </div>

        {/* Right Column (Seller & Action Sidebars) */}
        <div className="space-y-6">
          
          {/* Selling Price Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-xs">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase block">Current Selling Price</span>
              <span className="font-heading text-3xl font-black text-slate-900 block">
                ₹{property.price} Lakhs
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Offered directly by verified listing owner
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => navigate(`/property/${property.id}/valuation`)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                View Property Valuation
              </button>

              {property.auctionEnabled && (
                <button
                  onClick={() => navigate(`/auction/${property.id}/join`)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gavel className="w-4 h-4" />
                  Request Access / Join Live Auction
                </button>
              )}
            </div>
          </div>

          {/* Seller / Listing Agent Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Commercial Seller
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">{property.seller || 'Apex Commercial Realty'}</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" /> {property.sellerEmail || 'seller@apexrealty.com'}
                </span>
              </div>
            </div>

            <button
              onClick={() => alert(`Inquiry initiated for ${property.name}. The seller representative (${property.sellerEmail || 'seller@apexrealty.com'}) will respond shortly.`)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Contact Seller
            </button>
          </div>

        </div>

      </div>

      {/* Similar Properties Section */}
      {similarProperties.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-slate-900">Similar Properties</h2>
              <p className="text-xs text-slate-500">Other commercial and residential offerings in {property.city}</p>
            </div>
            <Link to="/properties" className="text-xs font-bold text-blue-600 hover:underline">
              View All Properties →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarProperties.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                onViewDetails={(prop) => navigate(`/property/${prop.id}`)}
                onAIPrediction={(prop) => navigate(`/property/${prop.id}/valuation`)}
                onBidNow={(prop) => navigate(`/auction/${prop.id}/join`)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
