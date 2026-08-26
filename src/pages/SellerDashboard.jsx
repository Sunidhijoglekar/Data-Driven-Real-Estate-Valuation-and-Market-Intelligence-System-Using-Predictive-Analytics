import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Gavel, Plus, ShieldCheck, Ticket, CheckCircle2, XCircle, Clock, PauseCircle,
  PlayCircle, Snowflake, Lock, Building2, MapPin, DollarSign, Users, AlertCircle,
  ArrowRight, Phone, Mail, Award, Check, RefreshCw, Eye, Sparkles
} from 'lucide-react';

export default function SellerDashboard({ user }) {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('auctions'); // 'auctions' | 'create_auction' | 'registrations'
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

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

  const fetchData = async () => {
    try {
      const [aucRes, propRes] = await Promise.all([
        apiService.getAuctions(),
        apiService.getProperties()
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

  // Update auction control status (Start Reg, Stop Reg, Start Live, Pause, Resume, Freeze, End, Close)
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

  // Approve / Reject registration request
  const handleRegistrationAction = async (registrationId, newStatus) => {
    setActionMsg({ type: '', text: '' });
    try {
      await apiService.updateRegistrationStatus(registrationId, newStatus, sellerId);
      setActionMsg({
        type: 'success',
        text: `Registration request ${newStatus.toLowerCase()}! Token issued to buyer.`
      });
      fetchData();
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to update registration status.'
      });
    }
  };

  // Handle Auction Creation
  const handleCreateAuction = async (e) => {
    e.preventDefault();
    if (!createForm.property_id || !createForm.starting_price) {
      setActionMsg({ type: 'error', text: 'Please select a property and starting price.' });
      return;
    }

    setCreating(true);
    setActionMsg({ type: '', text: '' });
    try {
      const res = await apiService.createAuction({
        property_id: createForm.property_id,
        seller_id: sellerId,
        starting_price: parseFloat(createForm.starting_price),
        minimum_increment: parseFloat(createForm.minimum_increment || 1),
        duration_hours: parseFloat(createForm.duration_hours || 24),
        max_participants: parseInt(createForm.max_participants || 10),
        auction_start: createForm.auction_start
      });

      setActionMsg({ type: 'success', text: 'Auction Created & Registration Opened!' });
      if (res.auction) setSelectedAuction(res.auction);
      setActiveTab('auctions');
      fetchData();
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to create auction.'
      });
    } finally {
      setCreating(false);
    }
  };

  // Open Sell Property Modal
  const handleOpenSellModal = (auc) => {
    setAuctionToSell(auc);
    const topBidder = auc.distinct_bidders && auc.distinct_bidders.length > 0 ? auc.distinct_bidders[0] : null;
    setSelectedBuyerId(topBidder ? topBidder.buyer_id : (auc.participants[0]?.buyer_id || 'buyer@example.com'));
    setCustomFinalPrice(String(auc.current_highest_bid || auc.starting_price));
    setShowSellModal(true);
  };

  // Finalize Property Sale
  const handleFinalizeSale = async (e) => {
    e.preventDefault();
    if (!auctionToSell || !selectedBuyerId) return;

    setSelling(true);
    setActionMsg({ type: '', text: '' });
    try {
      const res = await apiService.sellProperty(
        auctionToSell.auction_id,
        selectedBuyerId,
        parseFloat(customFinalPrice || auctionToSell.current_highest_bid),
        sellerId
      );

      setActionMsg({
        type: 'success',
        text: `Property marked as SOLD! Sale summary generated for ${selectedBuyerId}.`
      });
      setShowSellModal(false);
      fetchData();
      navigate(`/auction-result/${auctionToSell.auction_id}`);
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to finalize property sale.'
      });
    } finally {
      setSelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Loading Seller Auction Control Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 rounded-3xl p-8 text-white shadow-xl border border-blue-800/40 space-y-3">
        <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit">
          <ShieldCheck className="w-3.5 h-3.5" /> Seller Command Center
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black">Seller-Controlled Property Bidding Portal</h1>
        <p className="text-xs text-slate-300 max-w-2xl">
          Full real-time control over buyer token approvals, auction timing, live pause/freeze controls, and manual final buyer selection.
        </p>
      </div>

      {actionMsg.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border ${
          actionMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {actionMsg.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* TABS HEADER */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('auctions')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'auctions'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Gavel className="w-4 h-4" /> Auction Management & Controls ({auctions.length})
        </button>

        <button
          onClick={() => setActiveTab('create_auction')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'create_auction'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" /> Create Property Auction
        </button>
      </div>

      {/* TAB 1: AUCTION MANAGEMENT & CONTROLS */}
      {activeTab === 'auctions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: AUCTIONS SELECTOR LIST */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider">
              Your Property Auctions
            </h3>

            {auctions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                <Gavel className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No active auctions created yet.</p>
                <button
                  onClick={() => setActiveTab('create_auction')}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
                >
                  Create Auction Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {auctions.map(auc => {
                  const isSelected = selectedAuction?.auction_id === auc.auction_id;
                  const prop = auc.property || {};

                  return (
                    <div
                      key={auc.auction_id}
                      onClick={() => setSelectedAuction(auc)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="font-heading text-sm font-bold text-slate-900">{prop.name || 'Property'}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-600" /> {prop.locality}, {prop.city}
                          </p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          auc.status === 'LIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          auc.status === 'REGISTRATION_OPEN' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          auc.status === 'FROZEN' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                          auc.status === 'COMPLETED' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {auc.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <span>Highest: <strong className="text-slate-900 font-black">₹{auc.current_highest_bid} L</strong></span>
                        <span>Token Holders: <strong className="text-slate-900 font-bold">{auc.total_participants}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: SELECTED AUCTION CONTROL DASHBOARD */}
          <div className="lg:col-span-7 space-y-6">
            {!selectedAuction ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
                Select an auction from the left list to access live controls.
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
                
                {/* Auction Overview Header */}
                <div className="border-b border-slate-200 pb-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Auction ID: {selectedAuction.auction_id}
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      Status: {selectedAuction.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h2 className="font-heading text-xl font-black text-slate-900">
                    {selectedAuction.property?.name || 'Property Auction'}
                  </h2>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold uppercase block">Starting Price</span>
                      <strong className="text-slate-900 font-black">₹{selectedAuction.starting_price} L</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold uppercase block">Min Increment</span>
                      <strong className="text-slate-900 font-black">₹{selectedAuction.minimum_increment || 1} L</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold uppercase block">Participants</span>
                      <strong className="text-blue-600 font-black">{selectedAuction.total_participants} Token Holders</strong>
                    </div>
                  </div>
                </div>

                {/* SELLER CONTROL BUTTONS (EXACT MATCH FOR SELLER CONTROLS SPECIFICATION) */}
                <div className="space-y-3">
                  <h3 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Seller Real-Time Auction Controls
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Start Registration */}
                    <button
                      onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'REGISTRATION_OPEN')}
                      className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Ticket className="w-3.5 h-3.5 text-blue-600" /> Start Registration
                    </button>

                    {/* Stop Registration */}
                    <button
                      onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'REGISTRATION_CLOSED')}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-600" /> Stop Registration
                    </button>

                    {/* Start Live Auction */}
                    <button
                      onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'LIVE')}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Start Live Auction
                    </button>

                    {/* Pause Auction */}
                    <button
                      onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'PAUSED')}
                      className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <PauseCircle className="w-3.5 h-3.5 text-amber-600" /> Pause Auction
                    </button>

                    {/* Freeze Auction */}
                    <button
                      onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'FROZEN')}
                      className="px-3.5 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Snowflake className="w-3.5 h-3.5 text-cyan-600" /> Freeze Auction
                    </button>

                    {/* Close / End Auction */}
                    <button
                      onClick={() => handleUpdateAuctionStatus(selectedAuction.auction_id, 'CLOSED')}
                      className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> Close Auction
                    </button>
                  </div>
                </div>

                {/* TOKEN REGISTRATION REQUESTS SECTION */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Buyer Registration Requests ({selectedAuction.registrations?.length || 0})
                    </h3>
                    <span className="text-[10px] font-bold text-blue-600">Token Approval Controls</span>
                  </div>

                  {!selectedAuction.registrations || selectedAuction.registrations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">No pending buyer registration requests.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedAuction.registrations.map(reg => (
                        <div
                          key={reg.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{reg.buyer_name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                reg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                reg.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {reg.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">{reg.buyer_email} • {reg.buyer_phone}</p>
                          </div>

                          {reg.status === 'PENDING' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRegistrationAction(reg.id, 'APPROVED')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg shadow-sm"
                              >
                                Approve & Issue Token
                              </button>
                              <button
                                onClick={() => handleRegistrationAction(reg.id, 'REJECTED')}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase rounded-lg"
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

                {/* SELLER DECISION SECTION (MANUAL BUYER SELECTION & SELL PROPERTY) */}
                <div className="space-y-4 pt-2 border-t border-slate-200 bg-slate-50/80 p-5 rounded-2xl border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" /> Seller Decision & Final Buyer Selection
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Display all bidders and final bid amounts. Choose ANY approved participant to finalize the property sale.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenSellModal(selectedAuction)}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <DollarSign className="w-4 h-4" /> Sell Property Now
                    </button>
                  </div>

                  {/* DISTINCT BIDDERS TABLE / LIST */}
                  {!selectedAuction.distinct_bidders || selectedAuction.distinct_bidders.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border text-center text-xs text-slate-500">
                      No bids recorded yet. You may sell directly to any approved token participant.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedAuction.distinct_bidders.map((b, idx) => (
                        <div
                          key={b.buyer_id}
                          className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{b.bidder_name}</span>
                              {idx === 0 && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black uppercase rounded-full">
                                  Highest Bidder
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-3">
                              <span><Mail className="w-3 h-3 inline text-slate-400" /> {b.email}</span>
                              <span><Phone className="w-3 h-3 inline text-slate-400" /> {b.phone}</span>
                              <span>• {b.bid_count} Total Bids</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-heading text-sm font-black text-slate-900">₹{b.highest_bid} Lakhs</span>
                            <button
                              onClick={() => {
                                setSelectedBuyerId(b.buyer_id);
                                setCustomFinalPrice(String(b.highest_bid));
                                handleOpenSellModal(selectedAuction);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase rounded-lg transition-all"
                            >
                              Choose Buyer
                            </button>
                          </div>
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

      {/* TAB 2: CREATE PROPERTY AUCTION FORM */}
      {activeTab === 'create_auction' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-heading text-xl font-black text-slate-900">Create New Property Auction</h2>
            <p className="text-xs text-slate-500">Configure parameters for a seller-controlled token auction.</p>
          </div>

          <form onSubmit={handleCreateAuction} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Property</label>
              <select
                value={createForm.property_id}
                onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">-- Choose a Property --</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.price} Lakhs ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Starting Price (₹ Lakhs)</label>
                <input
                  type="number"
                  step="1"
                  value={createForm.starting_price}
                  onChange={(e) => setCreateForm({ ...createForm, starting_price: e.target.value })}
                  required
                  placeholder="e.g. 150"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Minimum Bid Increment (₹ Lakhs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={createForm.minimum_increment}
                  onChange={(e) => setCreateForm({ ...createForm, minimum_increment: e.target.value })}
                  required
                  placeholder="e.g. 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Auction Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={createForm.auction_start}
                  onChange={(e) => setCreateForm({ ...createForm, auction_start: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Auction Duration (Hours)</label>
                <input
                  type="number"
                  value={createForm.duration_hours}
                  onChange={(e) => setCreateForm({ ...createForm, duration_hours: e.target.value })}
                  placeholder="e.g. 24"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Max Number of Participants (Optional)</label>
                <input
                  type="number"
                  value={createForm.max_participants}
                  onChange={(e) => setCreateForm({ ...createForm, max_participants: e.target.value })}
                  placeholder="e.g. 15"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {creating ? <>Creating Auction...</> : <><Plus className="w-4 h-4" /> Create Auction & Open Registration</>}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: MANUAL BUYER SELECTION & PROPERTY SALE */}
      {showSellModal && auctionToSell && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="font-heading text-lg font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Confirm Property Sale
              </h3>
              <p className="text-xs text-slate-500">
                You are manually selecting the final buyer for {auctionToSell.property?.name}.
              </p>
            </div>

            <form onSubmit={handleFinalizeSale} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Final Buyer</label>
                <select
                  value={selectedBuyerId}
                  onChange={(e) => setSelectedBuyerId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  {auctionToSell.distinct_bidders && auctionToSell.distinct_bidders.map(b => (
                    <option key={b.buyer_id} value={b.buyer_id}>
                      {b.bidder_name} - Highest Bid: ₹{b.highest_bid} L ({b.email})
                    </option>
                  ))}
                  {auctionToSell.participants && auctionToSell.participants.map(p => (
                    <option key={p.buyer_id} value={p.buyer_id}>
                      [Approved Participant] {p.buyer_name} ({p.buyer_email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Final Selling Price (₹ Lakhs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={customFinalPrice}
                  onChange={(e) => setCustomFinalPrice(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-black text-slate-900"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">System Actions on Sale:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                  <li>Mark auction as Completed & Property as SOLD.</li>
                  <li>Remove property from available active listings.</li>
                  <li>Store buyer transaction details in PostgreSQL database store.</li>
                  <li>Generate official Sale Summary report.</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={selling}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  {selling ? <>Finalizing Sale...</> : <>Confirm & Sell Property</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
