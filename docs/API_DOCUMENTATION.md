# API Documentation

## Endpoints

### Health Check
- `GET /api/health`: Returns system status and current timestamp.

### Authentication
- `POST /api/auth/login`: Log in as Buyer, Seller, or Investor.

### Properties
- `GET /api/properties`: Retrieve filtered property listings.
- `GET /api/properties/:id`: Retrieve single property detail.
- `POST /api/properties`: Create a new property listing.
- `PUT /api/properties/:id`: Update property listing.
- `DELETE /api/properties/:id`: Delete property listing.

### Bids & Auctions
- `GET /api/bids/auctions`: Fetch all active & upcoming property auctions.
- `GET /api/bids/auctions/detail/:id`: Get detailed auction state.
- `POST /api/bids/auctions/:id/register`: Register for property auction.
- `POST /api/bids/auctions/:id/bid`: Place a verified auction bid.
- `POST /api/bids/auctions/:id/sell`: Finalize property sale to highest bidder.

### Machine Learning & Intelligence
- `POST /api/ml/predict`: Calculate property valuation with XGBoost & LSTM forecasts.
- `GET /api/ml/metrics`: Get accuracy and model comparison metrics.
- `GET /api/ml/historical-trends`: Fetch historical price trend benchmarks.

### Gemini AI
- `POST /api/gemini/insights`: Generate persona-tailored investment intelligence.
