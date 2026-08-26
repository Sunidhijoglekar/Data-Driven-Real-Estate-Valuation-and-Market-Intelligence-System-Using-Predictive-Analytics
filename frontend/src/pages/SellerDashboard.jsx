import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Gavel, Plus, ShieldCheck, Ticket, CheckCircle2, XCircle, Clock,
  PauseCircle, PlayCircle, Snowflake, Lock, Building2, MapPin, Users,
  AlertCircle, RefreshCw, Award, DollarSign
} from 'lucide-react';

const DEFAULT_FORM = {
  property_id: '',
  starting_price: '',
  minimum_increment: '1',
  duration_hours: '24',
  max_participants: '10',
  auction_start: ''
};

export default function SellerDashboard({ user }) {
  const navigate = useNavigate();
  const sellerId = user?.email || 'seller@apexrealty.com';

  const [auctions, setAuctions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [tab, setTab] = useState('management');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saleAuction, setSaleAuction] = useState(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const selectedAuction = useMemo(
    () => auctions.find(a => a.auction_id === selectedAuctionId) || auctions[0] || null,
    [auctions, selectedAuctionId]
  );

  const availableProperties = useMemo(
    () => properties.filter(p => !p.isSold && p.status !== 'Sold'),
    [properties]
  );

  const showMessage = (type, text) => setMessage({ type, text });

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [auctionRes, propertyRes] = await Promise.all([
        apiService.getAuctions(),
        apiService.getProperties()
      ]);

      const ownAuctions = (auctionRes.auctions || []).filter(
        a => String(a.seller_id || '').toLowerCase() === String(sellerId).toLowerCase()
      );

      setAuctions(ownAuctions);
      setProperties(propertyRes.properties || []);

      if (selectedAuctionId && ownAuctions.some(a => a.auction_id === selectedAuctionId)) {
        return;
      }
      if (ownAuctions.length) setSelectedAuctionId(ownAuctions[0].auction_id);
    } catch (error) {
      showMessage('error', error.response?.data?.error || error.message || 'Failed to load seller data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const handleCreateAuction = async (event) => {
    event.preventDefault();

    if (!form.property_id || !form.starting_price) {
      showMessage('error', 'Select a property and enter a starting price.');
      return;
    }

    setBusy(true);
    try {
      const res = await apiService.createAuction({
        property_id: form.property_id,
        seller_id: sellerId,
        starting_price: Number(form.starting_price),
        minimum_increment: Number(form.minimum_increment || 1),
        duration_hours: Number(form.duration_hours || 24),
        max_participants: Number(form.max_participants || 10),
        auction_start: form.auction_start
          ? new Date(form.auction_start).toISOString()
          : new Date().toISOString()
      });

      setForm(DEFAULT_FORM);
      setSelectedAuctionId(res.auction.auction_id);
      showMessage('success', 'Auction created. Registration is now open.');
      setTab('management');
      await fetchData(true);
    } catch (error) {
      showMessage('error', error.response?.data?.error || error.message || 'Failed to create auction.');
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (status) => {
    if (!selectedAuction) return;
    setBusy(true);
    try {
      const res = await apiService.updateAuctionStatus(
        selectedAuction.auction_id,
        status,
        sellerId
      );
      setSelectedAuctionId(res.auction.auction_id);
      showMessage('success', `Auction is now ${res.auction.status.replaceAll('_', ' ')}.`);
      await fetchData(true);
    } catch (error) {
      showMessage('error', error.response?.data?.error || error.message || 'Failed to update auction status.');
    } finally {
      setBusy(false);
    }
  };

  const updateRegistration = async (registration, status) => {
    setBusy(true);
    try {
      await apiService.updateRegistrationStatus(registration.id, status, sellerId);
      showMessage(
        'success',
        status === 'APPROVED'
          ? `Token issued to ${registration.buyer_name || registration.buyer_id}.`
          : 'Registration request rejected.'
      );
      await fetchData(true);
    } catch (error) {
      showMessage('error', error.response?.data?.error || error.message || 'Failed to update registration.');
    } finally {
      setBusy(false);
    }
  };

  const openSale = (auction) => {
    const candidates = auction.distinct_bidders?.length
      ? auction.distinct_bidders
      : (auction.participants || []).map(p => ({
          buyer_id: p.buyer_id,
          bidder_name: p.buyer_name,
          highest_bid: 0,
          email: p.buyer_email
        }));

    const top = candidates[0];
    setSaleAuction(auction);
    setSelectedBuyerId(top?.buyer_id || '');
    setFinalPrice(String(auction.current_highest_bid || auction.starting_price || ''));
  };

  const finalizeSale = async (event) => {
    event.preventDefault();
    if (!saleAuction || !selectedBuyerId) {
      showMessage('error', 'Select an authorized buyer before finalizing the sale.');
      return;
    }

    setBusy(true);
    try {
      const res = await apiService.sellProperty(
        saleAuction.auction_id,
        selectedBuyerId,
        Number(finalPrice),
        sellerId
      );

      setSaleAuction(null);
      showMessage('success', 'Property sold successfully. Opening the transaction summary.');
      await fetchData(true);
      navigate(`/auction-result/${res.auction.auction_id}`);
    } catch (error) {
      showMessage('error', error.response?.data?.error || error.message || 'Failed to finalize sale.');
    } finally {
      setBusy(false);
    }
  };

  const statusActions = () => {
    if (!selectedAuction) return null;
    const status = selectedAuction.status;

    if (status === 'REGISTRATION_OPEN') {
      return (
        <>
          <button disabled={busy} onClick={() => updateStatus('REGISTRATION_CLOSED')} className="action slate"><Lock className="w-4 h-4" /> Close Registration</button>
          <button disabled={busy} onClick={() => updateStatus('LIVE')} className="action green"><PlayCircle className="w-4 h-4" /> Start Live</button>
        </>
      );
    }

    if (status === 'REGISTRATION_CLOSED') {
      return (
        <>
          <button disabled={busy} onClick={() => updateStatus('REGISTRATION_OPEN')} className="action blue"><Ticket className="w-4 h-4" /> Reopen Registration</button>
          <button disabled={busy} onClick={() => updateStatus('LIVE')} className="action green"><PlayCircle className="w-4 h-4" /> Start Live</button>
        </>
      );
    }

    if (status === 'LIVE') {
      return (
        <>
          <button disabled={busy} onClick={() => updateStatus('PAUSED')} className="action amber"><PauseCircle className="w-4 h-4" /> Pause</button>
          <button disabled={busy} onClick={() => updateStatus('FROZEN')} className="action cyan"><Snowflake className="w-4 h-4" /> Freeze Bids</button>
          <button disabled={busy} onClick={() => updateStatus('ENDED')} className="action slate"><Lock className="w-4 h-4" /> End Bidding</button>
        </>
      );
    }

    if (status === 'PAUSED') {
      return (
        <>
          <button disabled={busy} onClick={() => updateStatus('LIVE')} className="action green"><PlayCircle className="w-4 h-4" /> Resume</button>
          <button disabled={busy} onClick={() => updateStatus('FROZEN')} className="action cyan"><Snowflake className="w-4 h-4" /> Freeze</button>
          <button disabled={busy} onClick={() => updateStatus('ENDED')} className="action slate"><Lock className="w-4 h-4" /> End Bidding</button>
        </>
      );
    }

    if (status === 'FROZEN') {
      return (
        <>
          <button disabled={busy} onClick={() => updateStatus('LIVE')} className="action green"><PlayCircle className="w-4 h-4" /> Resume Bidding</button>
          <button disabled={busy} onClick={() => updateStatus('ENDED')} className="action slate"><Lock className="w-4 h-4" /> End Bidding</button>
        </>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm font-bold text-slate-600">Loading seller auction control center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-7">
      <style>{`
        .action{display:inline-flex;align-items:center;gap:.4rem;padding:.6rem .8rem;border-radius:.75rem;font-size:.72rem;font-weight:800;cursor:pointer;border:1px solid transparent}
        .action:disabled{opacity:.5;cursor:not-allowed}
        .blue{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}.green{background:#dcfce7;color:#15803d;border-color:#bbf7d0}
        .amber{background:#fef3c7;color:#b45309;border-color:#fde68a}.cyan{background:#cffafe;color:#0e7490;border-color:#a5f3fc}
        .slate{background:#f1f5f9;color:#334155;border-color:#cbd5e1}
      `}</style>

      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 text-blue-300 text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Seller Command Center
        </div>
        <h1 className="font-heading text-3xl font-black mt-3">Seller-Controlled Auction Flow</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">
          Create an auction, review buyer token requests, authorize participants, control live bidding,
          and select the final buyer.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
          message.type === 'error'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {message.type === 'error'
            ? <AlertCircle className="w-5 h-5" />
            : <CheckCircle2 className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTab('management')} className={`px-5 py-2.5 rounded-xl text-xs font-black ${tab === 'management' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'}`}>
          <Gavel className="w-4 h-4 inline mr-2" />Auction Management ({auctions.length})
        </button>
        <button onClick={() => setTab('create')} className={`px-5 py-2.5 rounded-xl text-xs font-black ${tab === 'create' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'}`}>
          <Plus className="w-4 h-4 inline mr-2" />Create Auction
        </button>
        <button onClick={() => fetchData()} className="ml-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600">
          <RefreshCw className="w-4 h-4 inline mr-2" />Refresh
        </button>
      </div>

      {tab === 'create' && (
        <form onSubmit={handleCreateAuction} className="bg-white rounded-3xl border border-slate-200 shadow-lg p-7 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-black text-slate-900">Create New Property Auction</h2>
            <p className="text-xs text-slate-500 mt-1">Registration opens immediately after creation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="space-y-2 text-xs font-bold">
              Property
              <select required value={form.property_id} onChange={e => setForm({...form, property_id:e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                <option value="">Select property</option>
                {availableProperties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.city} — ₹{p.price} Lakhs</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-bold">
              Starting Price (₹ Lakhs)
              <input required min="0.01" step="0.01" type="number" value={form.starting_price} onChange={e => setForm({...form, starting_price:e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" />
            </label>

            <label className="space-y-2 text-xs font-bold">
              Minimum Increment (₹ Lakhs)
              <input required min="0.01" step="0.01" type="number" value={form.minimum_increment} onChange={e => setForm({...form, minimum_increment:e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" />
            </label>

            <label className="space-y-2 text-xs font-bold">
              Duration (hours)
              <input required min="1" step="1" type="number" value={form.duration_hours} onChange={e => setForm({...form, duration_hours:e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" />
            </label>

            <label className="space-y-2 text-xs font-bold">
              Maximum Participants
              <input required min="1" step="1" type="number" value={form.max_participants} onChange={e => setForm({...form, max_participants:e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" />
            </label>

            <label className="space-y-2 text-xs font-bold">
              Start Date & Time
              <input type="datetime-local" value={form.auction_start} onChange={e => setForm({...form, auction_start:e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" />
            </label>
          </div>

          <button disabled={busy || !availableProperties.length} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black">
            {busy ? 'Creating...' : 'Create Auction & Open Registration'}
          </button>
        </form>
      )}

      {tab === 'management' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-black">Your Auctions</h2>
              <span className="text-xs font-bold text-slate-500">{auctions.length}</span>
            </div>

            {auctions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Building2 className="w-9 h-9 mx-auto text-slate-300" />
                <p className="text-xs font-bold mt-3">No auctions yet.</p>
                <button onClick={() => setTab('create')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Create First Auction</button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[650px] overflow-y-auto">
                {auctions.map(auction => (
                  <button key={auction.auction_id} onClick={() => setSelectedAuctionId(auction.auction_id)} className={`w-full text-left p-4 rounded-2xl border transition ${
                    selectedAuction?.auction_id === auction.auction_id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex justify-between gap-3">
                      <span className="font-bold text-sm truncate">{auction.property?.name || auction.property_id}</span>
                      <span className="text-[9px] font-black px-2 py-1 rounded-full bg-slate-200 shrink-0">{auction.status.replaceAll('_',' ')}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">Highest: ₹{auction.current_highest_bid || auction.starting_price} Lakhs</p>
                    <p className="text-[11px] text-slate-500">{auction.total_participants} authorized participants · {auction.total_bids} bids</p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {selectedAuction && (
            <section className="lg:col-span-8 space-y-5">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
                      <Gavel className="w-4 h-4" /> {selectedAuction.auction_id}
                    </div>
                    <h2 className="font-heading text-2xl font-black mt-1">{selectedAuction.property?.name || 'Property Auction'}</h2>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedAuction.property?.locality}, {selectedAuction.property?.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">{statusActions()}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] uppercase font-bold text-slate-500">Status</p><p className="font-black text-sm mt-1">{selectedAuction.status.replaceAll('_',' ')}</p></div>
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] uppercase font-bold text-slate-500">Starting</p><p className="font-black text-sm mt-1">₹{selectedAuction.starting_price} L</p></div>
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] uppercase font-bold text-slate-500">Highest Bid</p><p className="font-black text-sm text-emerald-600 mt-1">₹{selectedAuction.current_highest_bid || selectedAuction.starting_price} L</p></div>
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] uppercase font-bold text-slate-500">Participants</p><p className="font-black text-sm mt-1">{selectedAuction.total_participants} / {selectedAuction.max_participants}</p></div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-lg font-black">Buyer Token Requests</h3>
                    <p className="text-xs text-slate-500">Approve only buyers you want to authorize for this auction.</p>
                  </div>
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>

                <div className="space-y-3">
                  {(selectedAuction.registrations || []).length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No registration requests yet.</p>
                  ) : (
                    selectedAuction.registrations.map(reg => (
                      <div key={reg.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-bold text-sm">{reg.buyer_name || 'Buyer'}</p>
                          <p className="text-xs text-slate-500">{reg.buyer_email || reg.buyer_id}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Requested {new Date(reg.requested_at).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            reg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800'
                            : reg.status === 'REJECTED' ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                          }`}>{reg.status}</span>
                          {reg.status === 'PENDING' && (
                            <>
                              <button disabled={busy} onClick={() => updateRegistration(reg, 'APPROVED')} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black"><CheckCircle2 className="w-3 h-3 inline mr-1" />Approve</button>
                              <button disabled={busy} onClick={() => updateRegistration(reg, 'REJECTED')} className="px-3 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black"><XCircle className="w-3 h-3 inline mr-1" />Reject</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-lg font-black">Bidders & Final Sale</h3>
                    <p className="text-xs text-slate-500">Highest bidder is only a candidate; you make the final sale decision.</p>
                  </div>
                  <Award className="w-6 h-6 text-amber-500" />
                </div>

                <div className="space-y-2">
                  {(selectedAuction.distinct_bidders || []).map((bidder, index) => (
                    <div key={bidder.buyer_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <p className="text-xs font-bold">{index === 0 ? '🏆 ' : ''}{bidder.bidder_name}</p>
                        <p className="text-[10px] text-slate-500">{bidder.email} · {bidder.bid_count} bid(s)</p>
                      </div>
                      <p className="font-black text-sm text-emerald-600">₹{bidder.highest_bid} L</p>
                    </div>
                  ))}

                  {(selectedAuction.distinct_bidders || []).length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">No bids have been placed yet.</p>
                  )}

                  {!['COMPLETED','CLOSED','CANCELLED'].includes(selectedAuction.status) && (
                    <button onClick={() => openSale(selectedAuction)} disabled={!selectedAuction.participants?.length} className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-xs font-black">
                      <DollarSign className="w-4 h-4 inline mr-1" /> Finalize Property Sale
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {saleAuction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={finalizeSale} className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-7 space-y-5">
            <div>
              <h2 className="font-heading text-xl font-black">Finalize Property Sale</h2>
              <p className="text-xs text-slate-500 mt-1">Only authorized participants can be selected. Final price cannot be below the highest bid.</p>
            </div>

            <label className="space-y-2 block text-xs font-bold">
              Select Buyer
              <select required value={selectedBuyerId} onChange={e => setSelectedBuyerId(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                <option value="">Select authorized buyer</option>
                {(saleAuction.participants || []).map(p => (
                  <option key={p.participant_id} value={p.buyer_id}>{p.buyer_name} — {p.buyer_email}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 block text-xs font-bold">
              Final Selling Price (₹ Lakhs)
              <input required min={saleAuction.current_highest_bid || saleAuction.starting_price} step="0.01" type="number" value={finalPrice} onChange={e => setFinalPrice(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" />
            </label>

            <div className="flex gap-3">
              <button type="button" onClick={() => setSaleAuction(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-black">Cancel</button>
              <button disabled={busy} className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-xs font-black">{busy ? 'Finalizing...' : 'Confirm Sale'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
