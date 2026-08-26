import React from 'react';
import { Building, MapPin, Maximize2, Bath, Bed, Sparkles, Gavel, Cpu, Eye, ShieldCheck, FileText } from 'lucide-react';

export default function PropertyCard({ property, onViewDetails, onAIPrediction, onBidNow }) {
  const highestBid = property.bids && property.bids.length > 0
    ? Math.max(...property.bids.map(b => b.amount))
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
      
      <div>
        {/* Card Header & Image */}
        <div className="relative h-48 overflow-hidden bg-slate-100">
          <img
            src={property.image}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

          {/* Match Score Badge */}
          {property.isRecommendation ? (
            <div className="absolute top-3 left-3 bg-amber-500/95 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm flex items-center gap-1 border border-amber-400/40">
              <Sparkles className="w-3 h-3 fill-amber-100 text-amber-100" />
              {property.matchScore}% Closest Match
            </div>
          ) : (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-extrabold text-blue-700 shadow-sm flex items-center gap-1 border border-blue-100">
              <Sparkles className="w-3 h-3 text-blue-600 fill-blue-600" />
              {property.matchScore || 95}% Match
            </div>
          )}

          {/* Auction Badge */}
          {property.auctionEnabled && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1 animate-pulse">
              <Gavel className="w-3 h-3" />
              Live Auction
            </div>
          )}

          {/* Price Tag */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Listed Price</span>
              <span className="font-heading text-xl font-bold tracking-tight">₹{property.price} Lakhs</span>
            </div>
            {highestBid && (
              <div className="text-right bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-400/30">
                <span className="text-[10px] uppercase font-bold text-emerald-100 block">Top Bid</span>
                <span className="text-xs font-extrabold text-white">₹{highestBid} L</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-heading font-bold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
              {property.name}
            </h3>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            {property.locality ? `${property.locality}, ${property.city}` : property.city}
          </p>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Area</span>
              <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                <Maximize2 className="w-3 h-3 text-blue-500" />
                {property.area} sqft
              </span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Config</span>
              <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                <Bed className="w-3 h-3 text-blue-500" />
                {property.bhk} BHK
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Age</span>
              <span className="text-xs font-bold text-slate-800">
                {property.age}
              </span>
            </div>
          </div>

          {/* Amenities Badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(property.amenities || []).slice(0, 3).map((a, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                {a}
              </span>
            ))}
            {(property.amenities || []).length > 3 && (
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                +{(property.amenities || []).length - 3} more
              </span>
            )}
          </div>

          {/* Valuation Preview */}
          <div className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 mb-4 text-xs">
            <span className="text-blue-900 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              Estimated Market Value:
            </span>
            <span className="font-extrabold text-blue-700">
              ₹{property.predictedPrice || property.price} Lakhs
            </span>
          </div>

        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-4 pt-0 grid grid-cols-3 gap-1.5">
        <button
          onClick={() => onViewDetails(property)}
          className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
          title="View Details"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">Details</span>
        </button>

        <button
          onClick={() => onAIPrediction(property)}
          className="py-2 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          title="Valuation Report"
        >
          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Valuation</span>
        </button>

        <button
          onClick={() => onBidNow(property)}
          className="py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          title="Bid Now"
        >
          <Gavel className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Bid Now</span>
        </button>
      </div>

    </div>
  );
}
