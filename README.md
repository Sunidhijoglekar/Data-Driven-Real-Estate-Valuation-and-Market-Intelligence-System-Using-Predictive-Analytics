# 🏠 Data-Driven Real Estate Valuation and Market Intelligence System Using Predictive Analytics

A full-stack real estate platform that combines **property valuation, predictive analytics, market intelligence, and a seller-controlled online auction system** into a single application.

The system helps users explore properties, estimate property values using machine learning, analyze market trends, and participate in controlled real-estate auctions.

---

## 📌 Project Overview

The **Data-Driven Real Estate Valuation and Market Intelligence System** is designed to make real-estate decision-making more data-driven and transparent.

The platform provides three major capabilities:

1. **Real Estate Property Management**
2. **AI/ML-Based Property Valuation and Market Intelligence**
3. **Seller-Controlled Real Estate Auction System**

The application supports different user roles such as:

- 👤 Buyer
- 🏢 Seller
- 📊 Investor

Each role has a dedicated dashboard and functionality.

---

## 🎯 Objectives

The main objectives of this project are:

- Provide a centralized platform for real-estate properties.
- Estimate property values using predictive analytics.
- Analyze historical property-price trends.
- Help buyers make informed investment decisions.
- Allow sellers to list and manage properties.
- Provide a controlled online auction mechanism.
- Allow sellers to approve buyers before they participate in auctions.
- Provide secure auction tokens to approved buyers.
- Enable multiple authorized buyers to participate in live bidding.
- Allow the seller to finalize the winner and complete the property transaction.
- Provide AI-generated insights for property and auction analysis.

---

# ✨ Key Features

## 🏠 Property Management

Users can:

- Browse available properties.
- View detailed property information.
- Search and filter properties.
- View property images.
- View location information.
- View property price and configuration.
- Add and manage seller properties.
- Update and delete property listings.

---

## 🤖 Machine Learning Property Valuation

The system uses machine-learning models to estimate property values based on property characteristics and historical data.

The ML module includes models such as:

- Random Forest
- XGBoost
- LSTM
- ARIMA

The system also includes:

- Data preprocessing
- Feature encoding
- Model training
- Model evaluation
- Prediction API
- Historical price trend analysis

---

## 📊 Market Intelligence

The platform provides market-oriented information including:

- Historical price trends
- Property valuation
- Price prediction
- Market analysis
- Property comparison
- Investment-oriented insights

This helps users understand potential property values and market movement.

---

# 🔨 Real Estate Auction System

The platform contains a seller-controlled auction workflow.

The complete auction flow is:

```text
Seller
   │
   ▼
Select Property
   │
   ▼
Create Auction
   │
   ▼
Auction Registration Opens
   │
   ▼
Buyer Requests Access
   │
   ▼
Seller Receives Request
   │
   ├───────────────┐
   ▼               ▼
Approve          Reject
   │               │
   ▼               ▼
Auction Token    Request Closed
Issued
   │
   ▼
Buyer Enters Live Auction
   │
   ▼
Buyer Places Bids
   │
   ▼
Multiple Buyers Can Bid
   │
   ▼
Auction Ends
   │
   ▼
Seller Reviews Bidding Result
   │
   ▼
Seller Selects Final Winner
   │
   ▼
Final Sale Price Confirmed
   │
   ▼
Transaction Completed

```
1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
