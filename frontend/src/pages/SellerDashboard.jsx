import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { apiService } from '../services/api';
import {
  Gavel, Plus, ShieldCheck, Ticket, CheckCircle2, XCircle, Clock, PauseCircle,
  PlayCircle, Snowflake, Lock, Building2, MapPin, DollarSign, Users, AlertCircle,
  ArrowRight, Phone, Mail, Award, Check, RefreshCw, Eye, Sparkles, TrendingUp, Settings, Bell, User, ArrowLeft
} from 'lucide-react';

export default function SellerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [auctions, setAuctions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Add Property Form
  const [propForm, setPropForm] = useState({
    name: '',
    locality: '',
    city: 'Bengaluru',
    price: '',
    bhk: '3',
    area_sqft: '1500',
    type: 'Apartment',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    description: ''
  });
  const [addPropSuccess, setAddPropSuccess] = useState(false);

  // Auction Creation Form
  const [createForm, setCreateForm] = useState({
    property_id: '',
    starting_price: '',
    minimum_increment: '1',
    duration_hours: '24',
    max_participants: '10',
    auction_start: new Date().toISOString().slice(0, 16)
  });
  const [creating, setCreating] = useState(false);

  // Manual Sell Modal State
  const [showSellModal, setShowSellModal] = useState(false);
  const [auctionToSell, setAuctionToSell] = useState(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [customFinalPrice, setCustomFinalPrice] = useState('');
  const [selling, setSelling] = useState(false);

  const sellerId = user ? user.email : 'seller@apexrealty.com';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const fetchData = async () => {
    try {
      const [aucRes, propRes, notifRes] = await Promise.all([
        apiService.getAuctions(),
        apiService.getProperties(),
        apiService.getNotifications(sellerId)
      ]);

      if (aucRes && aucRes.auctions) {
        setAuctions(aucRes.auctions);
        if (!selectedAuction && aucRes.auctions.length > 0) {
          setSelectedAuction(aucRes.auctions[0]);
        } else if (selectedAuction) {
          const updated = aucRes.auctions.find(a => a.auction_id === selectedAuction.auction_id);
          if (updated) setSelectedAuction(updated);
        }
      }

      if (propRes && propRes.properties) {
        setProperties(propRes.properties);
      }

      if (notifRes && notifRes.notifications) {
        setNotifications(notifRes.notifications);
      }
    } catch (err) {
      console.error('Error fetching seller dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAuctionStatus = async (auctionId, newStatus) => {
    setActionMsg({ type: '', text: '' });
    try {
      const res = await apiService.updateAuctionStatus(auctionId, newStatus, sellerId);
      setActionMsg({
        type: 'success',
        text: `Auction status updated to ${newStatus.replace('_', ' ')}!`
      });
      if (res.auction) setSelectedAuction(res.auction);
      fetchData();
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to update auction status.'
      });
    }
  };

  const handleRegistrationAction = async (registrationId, newStatus) => {
    setActionMsg({ type: '', text: '' });
    try {
      await apiService.updateRegistrationStatus(registrationId, newStatus, sellerId);
      setActionMsg({
        type: 'success',
        text: `Registration request ${newStatus.toLowerCase()}! Token issued.`
      });
      fetchData();
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to update registration status.'
      });
    }
  };

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    setActionMsg({ type: '', text: '' });
    try {
      const priceNum = parseFloat(propForm.price) || 120;
      const areaNum = parseInt(propForm.area_sqft, 10) || 1500;
      const newPropData = {
        name: propForm.name,
        locality: propForm.locality || 'Prime Locality',
        city: propForm.city || 'Bangalore',
        price: priceNum,
        bhk: parseInt(propForm.bhk, 10) || 3,
        area_sqft: areaNum,
        area: areaNum,
        type: propForm.type || 'Apartment',
        image: propForm.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        description: propForm.description || `${propForm.bhk} BHK ${propForm.type || 'Apartment'} in ${propForm.locality || 'Bangalore'}`,
        sellerEmail: sellerId,
        price_per_sqft: Math.round((priceNum * 100000) / areaNum)
      };

      const res = await apiService.createProperty(newPropData);
      const created = res.property || { id: `prop_${Date.now()}`, ...newPropData };
      setProperties(prev => [created, ...prev]);
      setAddPropSuccess(true);
      setTimeout(() => setAddPropSuccess(false), 4000);
      setPropForm({
        name: '',
        locality: '',
        city: 'Bangalore',
        price: '',
        bhk: '3',
        area_sqft: '1500',
        type: 'Apartment',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        description: ''
      });
      fetchData();
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to add property.'
      });
    }
  };

  const handleCreateAuctionSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.property_id) {
      setActionMsg({ type: 'error', text: 'Please select a property from your inventory to schedule an auction.' });
      return;
    }

    setCreating(true);
    setActionMsg({ type: '', text: '' });

    try {
      const selectedProp = properties.find(p => String(p.id) === String(createForm.property_id));
      const startPrice = parseFloat(createForm.starting_price) || (selectedProp ? parseFloat(selectedProp.price) : 100);
      const minInc = parseFloat(createForm.minimum_increment) || 1;
      const durHours = parseFloat(createForm.duration_hours) || 24;
      const maxBidders = parseInt(createForm.max_participants, 10) || 10;

      const res = await apiService.createAuction({
        property_id: String(createForm.property_id),
        seller_id: sellerId,
        starting_price: startPrice,
        minimum_increment: minInc,
        duration_hours: durHours,
        max_participants: maxBidders,
        auction_start: createForm.auction_start || new Date().toISOString()
      });

      setActionMsg({
        type: 'success',
        text: `Auction Scheduled Successfully! Registration is now open for token requests.`
      });
      await fetchData();
      if (res.auction) {
        setSelectedAuction(res.auction);
      }
      setTimeout(() => {
        handleTabChange('auction-management');
      }, 1000);
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to create auction.'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSellModal = (auc) => {
    setAuctionToSell(auc);
    const highest = auc.current_highest_bidder || (auc.participants && auc.participants[0]?.buyer_id) || '';
    setSelectedBuyerId(highest);
    setCustomFinalPrice(auc.current_highest_bid || auc.starting_price || '');
    setShowSellModal(true);
  };

  const handleFinalizeManualSale = async (e) => {
    e.preventDefault();
    if (!selectedBuyerId) {
      setActionMsg({ type: 'error', text: 'Please select or enter a buyer email.' });
      return;
    }
    setSelling(true);
    try {
      await apiService.completeManualSale(
        auctionToSell.auction_id,
        selectedBuyerId,
        customFinalPrice || auctionToSell.current_highest_bid,
        sellerId
      );
      setActionMsg({
        type: 'success',
        text: `Property sold successfully to ${selectedBuyerId} for ₹${customFinalPrice} Lakhs!`
      });
      setShowSellModal(false);
      fetchData();
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to sell property.'
      });
    } finally {
      setSelling(false);
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
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            Back to Dashboard
          </button>
        </div>
      )}

      {/* ================= SELLER DASHBOARD OVERVIEW ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 border border-emerald-400/20">
                <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                Seller Portal • Listing & Auction Command Center
              </div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'Seller'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Manage your listings, schedule seller-controlled auctions, approve buyer pass requests, and execute sales.
              </p>
            </div>

            <button
              onClick={() => handleTabChange('add-property')}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Property
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400">Listed Properties</span>
              <strong className="text-2xl font-black text-slate-900 block">{properties.length}</strong>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-600">Active Auctions</span>
              <strong className="text-2xl font-black text-emerald-600 block">{auctions.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length}</strong>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-blue-600">Pending Pass Requests</span>
              <strong className="text-2xl font-black text-blue-600 block">
                {auctions.reduce((acc, a) => acc + (a.registrations?.filter(r => r.status === 'PENDING').length || 0), 0)}
              </strong>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-amber-600">Sold Properties</span>
              <strong className="text-2xl font-black text-amber-600 block">
                {auctions.filter(a => a.status === 'COMPLETED').length}
              </strong>
            </div>
          </div>

          {/* Pending Buyer Access Requests Section */}
          {(() => {
            const allPendingRequests = auctions.flatMap(auc =>
              (auc.registrations || [])
                .filter(r => r.status === 'PENDING')
                .map(r => ({ ...r, auction: auc, property: auc.property }))
            );

            if (allPendingRequests.length === 0) return null;

            return (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 rounded-3xl border-2 border-amber-300 p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                    <h3 className="font-heading font-extrabold text-amber-950 text-base sm:text-lg flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-amber-600" />
                      Action Required: Buyer Access Requests ({allPendingRequests.length})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-200/70 px-3 py-1 rounded-full w-fit">
                    Pending Seller Approval
                  </span>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed">
                  The following buyers have requested access to bid on your live auctions. Approve their requests to issue an active Auction Token so they can begin placing bids immediately.
                </p>

                <div className="space-y-3 pt-1">
                  {allPendingRequests.map((req) => (
                    <div
                      key={req.registration_id || req.id}
                      className="bg-white rounded-2xl border border-amber-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {req.buyer_name || 'Buyer'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({req.buyer_email || req.buyer_id})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Property: <strong className="text-slate-800">{req.property?.name || req.auction?.auction_id}</strong> • Requested at: {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRegistrationAction(req.registration_id || req.id, 'APPROVED')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve & Issue Token
                        </button>
                        <button
                          onClick={() => handleRegistrationAction(req.registration_id || req.id, 'REJECTED')}
                          className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => handleTabChange('add-property')}
              className="bg-white hover:bg-emerald-50/50 border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-sm group-hover:text-emerald-600">Add Property</h3>
                  <p className="text-xs text-slate-500">List new real estate offering</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <div 
              onClick={() => handleTabChange('create-auction')}
              className="bg-white hover:bg-emerald-50/50 border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Gavel className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-sm group-hover:text-emerald-600">Create Auction</h3>
                  <p className="text-xs text-slate-500">Launch a live bidding event</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <div 
              onClick={() => handleTabChange('auction-management')}
              className="bg-white hover:bg-emerald-50/50 border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-sm group-hover:text-emerald-600">Auction Control</h3>
                  <p className="text-xs text-slate-500">Approve passes & controls</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Properties Overview List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-slate-900">Your Properties Overview</h2>
              <button
                onClick={() => handleTabChange('my-properties')}
                className="text-xs font-extrabold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.slice(0, 3).map((p) => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="h-32 rounded-xl overflow-hidden bg-slate-200 relative">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      {p.city}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{p.name}</h3>
                    <p className="text-emerald-700 font-extrabold text-xs mt-0.5">₹{p.price} Lakhs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ================= MY PROPERTIES TAB ================= */}
      {activeTab === 'my-properties' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                My Listed Properties ({properties.length})
              </h2>
              <p className="text-xs text-slate-500">Real estate inventory submitted under your account</p>
            </div>
            <button
              onClick={() => handleTabChange('add-property')}
              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded-xl" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <p className="text-xs text-slate-500">{p.city} • {p.area_sqft || p.area} sqft</p>
                  <p className="text-emerald-600 font-extrabold text-sm mt-1">₹{p.price} Lakhs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ADD PROPERTY TAB ================= */}
      {activeTab === 'add-property' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              List New Property
            </h2>
            <p className="text-xs text-slate-500">Enter property details for market listing and auction enabling</p>
          </div>

          {addPropSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Property added successfully to your inventory!
            </div>
          )}

          <form onSubmit={handleAddPropertySubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Property Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Sapphire Heights"
                  value={propForm.name}
                  onChange={e => setPropForm({ ...propForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <select
                  value={propForm.city}
                  onChange={e => setPropForm({ ...propForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="Bangalore">Bangalore (Bengaluru)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar"
                  value={propForm.locality}
                  onChange={e => setPropForm({ ...propForm, locality: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Listed Price (₹ Lakhs)</label>
                <input
                  type="number"
                  required
                  placeholder="150"
                  value={propForm.price}
                  onChange={e => setPropForm({ ...propForm, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">BHK Config</label>
                <input
                  type="number"
                  value={propForm.bhk}
                  onChange={e => setPropForm({ ...propForm, bhk: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Area (Sq. Ft.)</label>
                <input
                  type="number"
                  value={propForm.area_sqft}
                  onChange={e => setPropForm({ ...propForm, area_sqft: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Image URL</label>
              <input
                type="text"
                value={propForm.image}
                onChange={e => setPropForm({ ...propForm, image: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              Submit Listing
            </button>
          </form>
        </div>
      )}

      {/* ================= MANAGE PROPERTIES TAB ================= */}
      {activeTab === 'manage-properties' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Inventory Management
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                  <th className="py-3 px-2">Property</th>
                  <th className="py-3 px-2">City</th>
                  <th className="py-3 px-2">Price</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-2 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-2 text-slate-600">{p.city}</td>
                    <td className="py-3 px-2 font-bold text-emerald-600">₹{p.price} L</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">Active</span>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => {
                          setCreateForm({ ...createForm, property_id: String(p.id), starting_price: String(p.price) });
                          handleTabChange('create-auction');
                        }}
                        className="px-2.5 py-1 bg-amber-500 text-white font-bold rounded text-[10px] cursor-pointer"
                      >
                        Create Auction
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= CREATE AUCTION TAB ================= */}
      {activeTab === 'create-auction' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-500" />
              Schedule Real Estate Auction
            </h2>
            <p className="text-xs text-slate-500">Configure reserve price, duration, and participant cap for bidding event</p>
          </div>

          {actionMsg.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${actionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {actionMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateAuctionSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Property</label>
              <select
                required
                value={createForm.property_id}
                onChange={e => {
                  const pid = e.target.value;
                  const found = properties.find(p => String(p.id) === String(pid));
                  setCreateForm({
                    ...createForm,
                    property_id: pid,
                    starting_price: found ? String(found.price) : ''
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="">Select a property from inventory...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.city} - ₹{p.price} Lakhs)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Starting Price (₹ Lakhs)</label>
                <input
                  type="number"
                  required
                  value={createForm.starting_price}
                  onChange={e => setCreateForm({ ...createForm, starting_price: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Bid Increment (₹ Lakhs)</label>
                <input
                  type="number"
                  required
                  value={createForm.minimum_increment}
                  onChange={e => setCreateForm({ ...createForm, minimum_increment: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  required
                  value={createForm.duration_hours}
                  onChange={e => setCreateForm({ ...createForm, duration_hours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Bidders</label>
                <input
                  type="number"
                  value={createForm.max_participants}
                  onChange={e => setCreateForm({ ...createForm, max_participants: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              {creating ? 'Creating Auction...' : 'Launch Live Auction'}
            </button>
          </form>
        </div>
      )}

      {/* ================= AUCTION MANAGEMENT TAB ================= */}
      {activeTab === 'auction-management' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Auction Control & Buyer Token Approvals
              </h2>
              <p className="text-xs text-slate-500">Approve bidder registration requests and manage live state</p>
            </div>
            <button onClick={fetchData} className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {actionMsg.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${actionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {actionMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-xs uppercase text-slate-400">Your Auctions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auctions.map(auc => (
                  <div
                    key={auc.auction_id}
                    onClick={() => setSelectedAuction(auc)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all space-y-1 ${
                      selectedAuction?.auction_id === auc.auction_id
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold truncate max-w-[150px]">{auc.property?.name || auc.auction_id}</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full text-[9px] font-black">{auc.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Highest Bid: ₹{auc.current_highest_bid || auc.starting_price} Lakhs</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedAuction && (
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-heading text-lg font-extrabold text-slate-900">
                      {selectedAuction.property?.name || selectedAuction.auction_id}
                    </h3>
                    <p className="text-xs text-slate-500">ID: {selectedAuction.auction_id} • Status: <strong className="text-emerald-600">{selectedAuction.status}</strong></p>
                  </div>

                  <div className="flex gap-2">
                    {selectedAuction.status === 'UPCOMING' && (
                      <button
                        onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'LIVE')}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Start Live
                      </button>
                    )}
                    {selectedAuction.status === 'LIVE' && (
                      <button
                        onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'PAUSED')}
                        className="px-3 py-1.5 bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Pause
                      </button>
                    )}
                    {selectedAuction.status === 'PAUSED' && (
                      <button
                        onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'LIVE')}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenSellModal(selectedAuction)}
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Sell Property
                    </button>
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase text-slate-400">Pending Buyer Pass Requests</h4>
                  {(!selectedAuction.registrations || selectedAuction.registrations.length === 0) ? (
                    <p className="text-xs text-slate-400">No pass requests submitted yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAuction.registrations.map(reg => (
                        <div key={reg.registration_id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-900 block">{reg.buyer_name || reg.buyer_id}</strong>
                            <span className="text-[10px] text-slate-500">Pass Deposit: ₹{reg.deposit_amount} Lakhs • Status: {reg.status}</span>
                          </div>
                          {reg.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRegistrationAction(reg.registration_id, 'APPROVED')}
                                className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Approve & Issue Token
                              </button>
                              <button
                                onClick={() => handleRegistrationAction(reg.registration_id, 'REJECTED')}
                                className="px-3 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SOLD PROPERTIES TAB ================= */}
      {activeTab === 'sold-properties' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Sold Property Registry
          </h2>
          <div className="space-y-3">
            {auctions.filter(a => a.status === 'COMPLETED').map(auc => (
              <div key={auc.auction_id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900 block text-sm">{auc.property?.name || auc.auction_id}</strong>
                  <span className="text-slate-600">Buyer: {auc.current_highest_bidder || 'Direct Purchaser'}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-700 font-extrabold text-base block">₹{auc.current_highest_bid || auc.starting_price} Lakhs</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-md">Transaction Closed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ANALYTICS TAB ================= */}
      {activeTab === 'analytics' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Market & Listing Analytics
          </h2>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <strong className="text-slate-900 text-sm block">Listing Performance Summary</strong>
            <p className="text-slate-600">Average bidding competition ratio across your auctions is 4.2 participants per property with average price realization 14% above reserve price.</p>
          </div>
        </div>
      )}

      {/* ================= NOTIFICATIONS TAB ================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              Seller Alerts & Bidder Requests ({notifications.length})
            </h2>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-600 p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No notifications yet. When buyers request access or place bids, alerts will appear here in real-time.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    notif.type === 'REGISTRATION_REQUESTED'
                      ? 'bg-amber-50/80 border-amber-200'
                      : notif.type === 'SELLER_APPROVED_BIDDER'
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {notif.type === 'REGISTRATION_REQUESTED' && <Ticket className="w-4 h-4 text-amber-600 shrink-0" />}
                      {notif.type === 'SELLER_APPROVED_BIDDER' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {notif.type === 'AUCTION_CREATED' && <Gavel className="w-4 h-4 text-blue-600 shrink-0" />}
                      <span className="font-extrabold text-slate-900 text-sm">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.message}</p>
                  </div>

                  <div className="shrink-0">
                    {notif.type === 'REGISTRATION_REQUESTED' && (
                      <button
                        onClick={() => {
                          if (notif.registration_id) {
                            handleRegistrationAction(notif.registration_id, 'APPROVED');
                          } else {
                            handleTabChange('auction-management');
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Bidder
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= PROFILE TAB ================= */}
      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center">
              {user?.name ? user.name.charAt(0) : 'S'}
            </div>
            <div>
              <h2 className="font-heading text-xl font-extrabold text-slate-900">{user?.name || 'Seller'}</h2>
              <p className="text-xs text-slate-500">{user?.email || 'seller@apexrealty.com'}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Verified Commercial Seller
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="font-heading font-extrabold text-slate-900 text-base">Finalize Sale Transaction</h3>
            <p className="text-slate-500">Sell property directly to highest bidder or custom purchaser.</p>

            <form onSubmit={handleFinalizeManualSale} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Purchaser Email</label>
                <input
                  type="email"
                  required
                  value={selectedBuyerId}
                  onChange={e => setSelectedBuyerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Final Sale Amount (₹ Lakhs)</label>
                <input
                  type="number"
                  required
                  value={customFinalPrice}
                  onChange={e => setCustomFinalPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selling}
                  className="w-1/2 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {selling ? 'Closing...' : 'Confirm Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
