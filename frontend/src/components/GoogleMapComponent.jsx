import React from 'react';
import { MapPin, School, Hospital, Train, ShoppingBag, Navigation } from 'lucide-react';

export default function GoogleMapComponent({ property }) {
  const lat = property.lat || 12.9716;
  const lng = property.lng || 77.5946;

  // Nearby Points of Interest simulation
  const nearbyPois = [
    { type: 'School', name: 'Bangalore International School / National Public School', dist: '0.8 km', icon: School, color: 'text-blue-600 bg-blue-50' },
    { type: 'Hospital', name: 'Fortis Healthcare / Apollo Hospital', dist: '1.2 km', icon: Hospital, color: 'text-rose-600 bg-rose-50' },
    { type: 'Metro Station', name: 'City Metro Line 3 Express Hub', dist: '0.4 km', icon: Train, color: 'text-purple-600 bg-purple-50' },
    { type: 'Shopping Mall', name: 'Phoenix Marketcity / Inorbit Mall', dist: '1.5 km', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-sm">Google Maps Location & Nearby Landmarks</h3>
            <p className="text-[11px] text-slate-500">{property.locality || property.name}, {property.city}</p>
          </div>
        </div>

        <span className="text-[10px] bg-slate-100 font-bold text-slate-600 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Navigation className="w-3 h-3 text-blue-500" />
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

      {/* Embedded Map Canvas */}
      <div className="relative h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <iframe
          title="Property Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`}
          className="w-full h-full filter saturate-105"
        ></iframe>

        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800">
          <MapPin className="w-4 h-4 text-rose-500 fill-rose-500" />
          {property.name}
        </div>
      </div>

      {/* Points of Interest Grid */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Nearby Infrastructure & Essentials
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {nearbyPois.map((poi, idx) => {
            const IconComp = poi.icon;
            return (
              <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${poi.color}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block line-clamp-1">{poi.name}</span>
                    <span className="text-[10px] text-slate-400">{poi.type}</span>
                  </div>
                </div>
                <span className="font-extrabold text-blue-700 text-[11px] shrink-0 ml-2">{poi.dist}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
