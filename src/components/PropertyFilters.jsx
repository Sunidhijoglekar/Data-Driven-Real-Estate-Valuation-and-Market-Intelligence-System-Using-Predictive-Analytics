import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw, Check, IndianRupee, Maximize2, Calendar, Sparkles } from 'lucide-react';

export default function PropertyFilters({ onSearch, cities = ["All", "Mumbai", "Delhi NCR", "Bangalore", "Pune", "Hyderabad", "Chennai"] }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All');
  
  // Amenities filter
  const [amenity, setAmenity] = useState('All');
  const [manualAmenity, setManualAmenity] = useState('');

  // Area (Sq Ft) filter
  const [areaPreset, setAreaPreset] = useState('All');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');

  // Property Age filter
  const [agePreset, setAgePreset] = useState('All');
  const [manualAge, setManualAge] = useState('');

  // Budget (₹ in Lakhs) filter
  const [budgetPreset, setBudgetPreset] = useState('All');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // BHK Filter
  const [bhk, setBhk] = useState('All');

  const amenityOptions = [
    "All", "Swimming Pool", "Gym", "Security", "Parking", "Elevator", "Clubhouse", "Power Backup", "Garden"
  ];

  const handleApply = (e) => {
    if (e) e.preventDefault();

    // Determine final values combining presets and manual inputs
    let finalAmenity = amenity !== 'All' ? amenity : manualAmenity.trim();
    
    let finalMinArea = minArea;
    let finalMaxArea = maxArea;
    if (areaPreset === '500-1000') { finalMinArea = '500'; finalMaxArea = '1000'; }
    if (areaPreset === '1000-1500') { finalMinArea = '1000'; finalMaxArea = '1500'; }
    if (areaPreset === '1500-2000') { finalMinArea = '1500'; finalMaxArea = '2000'; }
    if (areaPreset === '2000+') { finalMinArea = '2000'; finalMaxArea = ''; }

    let finalAge = agePreset !== 'All' ? agePreset : manualAge.trim();

    let finalMinPrice = minBudget;
    let finalMaxPrice = maxBudget;
    if (budgetPreset === '0-100') { finalMinPrice = '0'; finalMaxPrice = '100'; }
    if (budgetPreset === '100-200') { finalMinPrice = '100'; finalMaxPrice = '200'; }
    if (budgetPreset === '200-300') { finalMinPrice = '200'; finalMaxPrice = '300'; }
    if (budgetPreset === '300+') { finalMinPrice = '300'; finalMaxPrice = ''; }

    onSearch({
      search,
      city,
      amenity: finalAmenity,
      minArea: finalMinArea,
      maxArea: finalMaxArea,
      propertyAge: finalAge,
      minPrice: finalMinPrice,
      maxPrice: finalMaxPrice,
      bhk
    });
  };

  const handleReset = () => {
    setSearch('');
    setCity('All');
    setAmenity('All');
    setManualAmenity('');
    setAreaPreset('All');
    setMinArea('');
    setMaxArea('');
    setAgePreset('All');
    setManualAge('');
    setBudgetPreset('All');
    setMinBudget('');
    setMaxBudget('');
    setBhk('All');
    onSearch({});
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-sm">Smart Multi-Criteria Search Filters</h3>
            <p className="text-[11px] text-slate-500">Supports both dropdown presets and precise manual inputs</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      <form onSubmit={handleApply} className="space-y-4">
        {/* Main Search Bar & City */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search property name, locality, developer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Major Cities</option>
              {cities.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Grid Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* 1. Estimated Budget (₹ Lakhs) */}
          <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
              Budget (₹ Lakhs)
            </label>
            <div className="space-y-1.5">
              <select
                value={budgetPreset}
                onChange={(e) => setBudgetPreset(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="All">Preset Range</option>
                <option value="0-100">Under ₹100 Lakhs</option>
                <option value="100-200">₹100 - ₹200 Lakhs</option>
                <option value="200-300">₹200 - ₹300 Lakhs</option>
                <option value="300+">₹300+ Lakhs</option>
              </select>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minBudget}
                  onChange={(e) => { setMinBudget(e.target.value); setBudgetPreset('All'); }}
                  className="w-1/2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxBudget}
                  onChange={(e) => { setMaxBudget(e.target.value); setBudgetPreset('All'); }}
                  className="w-1/2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* 2. Area (Sq. Ft.) */}
          <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
              Area (Sq. Ft.)
            </label>
            <div className="space-y-1.5">
              <select
                value={areaPreset}
                onChange={(e) => setAreaPreset(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="All">Preset Area</option>
                <option value="500-1000">500 - 1000 sq ft</option>
                <option value="1000-1500">1000 - 1500 sq ft</option>
                <option value="1500-2000">1500 - 2000 sq ft</option>
                <option value="2000+">2000+ sq ft</option>
              </select>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min SqFt"
                  value={minArea}
                  onChange={(e) => { setMinArea(e.target.value); setAreaPreset('All'); }}
                  className="w-1/2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max SqFt"
                  value={maxArea}
                  onChange={(e) => { setMaxArea(e.target.value); setAreaPreset('All'); }}
                  className="w-1/2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Property Age */}
          <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Property Age
            </label>
            <div className="space-y-1.5">
              <select
                value={agePreset}
                onChange={(e) => setAgePreset(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="All">All Ages</option>
                <option value="<1 yr">&lt; 1 Year (New/Ready)</option>
                <option value="1-5 yrs">1 - 5 Years</option>
                <option value="5-10 yrs">5 - 10 Years</option>
                <option value=">10 yrs">&gt; 10 Years</option>
              </select>

              <input
                type="text"
                placeholder="Or custom age (e.g. 2 yrs)"
                value={manualAge}
                onChange={(e) => { setManualAge(e.target.value); setAgePreset('All'); }}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* 4. Amenities */}
          <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Amenities
            </label>
            <div className="space-y-1.5">
              <select
                value={amenity}
                onChange={(e) => setAmenity(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                {amenityOptions.map(a => (
                  <option key={a} value={a}>{a === 'All' ? 'All Amenities' : a}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Or type amenity..."
                value={manualAmenity}
                onChange={(e) => { setManualAmenity(e.target.value); setAmenity('All'); }}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">BHK Configuration:</span>
            {['All', '1', '2', '3', '4'].map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBhk(b)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  bhk === b
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b === 'All' ? 'All BHK' : `${b} BHK`}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            Apply Smart Search
          </button>
        </div>
      </form>
    </div>
  );
}
