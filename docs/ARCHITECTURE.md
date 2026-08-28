# System Architecture

## Architecture Overview

The system is organized into a modular, decoupled architecture separating presentation, business logic, persistence, and machine learning components.

### 1. Frontend (`frontend/`)
- **Framework**: React 19 with Vite 6.
- **Styling**: Tailwind CSS v4.
- **Components**: Modular page layouts for Buyer, Seller, and Investor personas, live bidding modals, interactive maps, and analytical dashboards.

### 2. Backend (`backend/`)
- **Framework**: Express.js.
- **Controllers**:
  - `authController.js`: Multi-role demo authentication.
  - `propertyController.js`: Property listing CRUD, filtering, and search.
  - `bidController.js`: Seller-controlled auction registrations, token access, and real-time bids.
  - `mlController.js`: ML valuation predictions and time series forecasts.
  - `geminiController.js`: AI-driven contextual insights using Gemini 2.5 Flash.
- **Database Layer**: In-memory JSON-persisted data store backed by `ml/datasets/current_properties.json` and `ml/datasets/historical_price_trends.json`.

### 3. Machine Learning (`ml/`)
- **Datasets**: `ml/datasets/Dataset.csv` dataset processed into structured JSON representations.
- **Models**:
  - **Regression**: Random Forest & XGBoost for current price valuation.
  - **Forecasting**: ARIMA & LSTM Neural Networks for 1, 3, and 5-year price projections.
