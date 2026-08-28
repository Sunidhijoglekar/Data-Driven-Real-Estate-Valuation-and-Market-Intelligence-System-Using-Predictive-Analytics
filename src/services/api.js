import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiService = {
  // Auth
  login: async (credentials) => {
    const res = await API.post('/auth/login', credentials);
    return res.data;
  },

  // Properties
  getProperties: async (filters = {}) => {
    const res = await API.get('/properties', { params: filters });
    return res.data;
  },

  getPropertyById: async (id) => {
    const res = await API.get(`/properties/${id}`);
    return res.data;
  },

  createProperty: async (propertyData) => {
    const res = await API.post('/properties', propertyData);
    return res.data;
  },

  updateProperty: async (id, propertyData) => {
    const res = await API.put(`/properties/${id}`, propertyData);
    return res.data;
  },

  deleteProperty: async (id) => {
    const res = await API.delete(`/properties/${id}`);
    return res.data;
  },

  // Bidding & Auction System
  getAuctions: async () => {
    const res = await API.get('/bids/auctions');
    return res.data;
  },

  getAuctionById: async (auctionId) => {
    const res = await API.get(`/bids/auctions/detail/${auctionId}`);
    return res.data;
  },

  getAuctionByPropertyId: async (propertyId) => {
    const res = await API.get(`/bids/auctions/property/${propertyId}`);
    return res.data;
  },

  createAuction: async (auctionData) => {
    const res = await API.post('/bids/auctions/create', auctionData);
    return res.data;
  },

  requestRegistration: async (auctionId, buyerData) => {
    const res = await API.post(`/bids/auctions/${auctionId}/register`, buyerData);
    return res.data;
  },

  updateRegistrationStatus: async (registrationId, status, sellerId) => {
    const res = await API.put(`/bids/registrations/${registrationId}/status`, { status, sellerId });
    return res.data;
  },

  getUserRegistrations: async (buyerId) => {
    const res = await API.get(`/bids/registrations/user/${encodeURIComponent(buyerId)}`);
    return res.data;
  },

  updateAuctionStatus: async (auctionId, status, sellerId) => {
    const res = await API.put(`/bids/auctions/${auctionId}/status`, { status, sellerId });
    return res.data;
  },

  sellProperty: async (auctionId, buyerId, finalPrice, sellerId) => {
    const res = await API.post(`/bids/auctions/${auctionId}/sell`, { buyerId, finalPrice, sellerId });
    return res.data;
  },

  placeAuctionBid: async (auctionId, bidData) => {
    const res = await API.post(`/bids/auctions/${auctionId}/bid`, bidData);
    return res.data;
  },

  placeBid: async (id, bidData) => {
    const res = await API.post(`/bids/auctions/${id}/bid`, bidData);
    return res.data;
  },

  getWinnerAiReport: async (auctionId) => {
    const res = await API.get(`/bids/auctions/${auctionId}/winner-ai`);
    return res.data;
  },

  // Notifications
  getNotifications: async (userId) => {
    try {
      const res = await API.get('/bids/notifications', { params: { userId } });
      return res.data;
    } catch {
      return { notifications: [] };
    }
  },

  markNotificationRead: async (id) => {
    const res = await API.put(`/bids/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async (userId) => {
    const res = await API.post('/bids/notifications/read-all', { userId });
    return res.data;
  },

  // Token System
  getBuyerTokens: async (buyerId) => {
    const res = await API.get(`/bids/tokens/${encodeURIComponent(buyerId)}`);
    return res.data;
  },

  topupBuyerTokens: async (buyerId, amount = 5) => {
    const res = await API.post(`/bids/tokens/${encodeURIComponent(buyerId)}/topup`, { amount });
    return res.data;
  },

  // ML & Intelligence
  predictValuation: async (propertyData) => {
    const res = await API.post('/ml/predict', propertyData);
    return res.data;
  },

  getMLMetrics: async () => {
    const res = await API.get('/ml/metrics');
    return res.data;
  },

  getHistoricalTrends: async () => {
    const res = await API.get('/ml/historical-trends');
    return res.data;
  },

  // Gemini AI Insights
  getGeminiInsights: async (property, valuation, role) => {
    const res = await API.post('/gemini/insights', { property, valuation, role });
    return res.data;
  }
};
