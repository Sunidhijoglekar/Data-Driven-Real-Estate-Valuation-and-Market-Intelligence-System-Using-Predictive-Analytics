-- Real Estate Valuation and Market Intelligence System Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Buyer', 'Seller', 'Investor')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    locality VARCHAR(150),
    price_lakhs NUMERIC(10, 2) NOT NULL,
    area_sqft NUMERIC(10, 2) NOT NULL,
    bhk INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    property_age VARCHAR(50),
    age_years NUMERIC(5, 2),
    amenities JSONB,
    image_url TEXT,
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    seller_name VARCHAR(255),
    seller_email VARCHAR(255),
    description TEXT,
    auction_enabled BOOLEAN DEFAULT FALSE,
    starting_price NUMERIC(10, 2),
    min_increment NUMERIC(10, 2),
    auction_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bids (
    id VARCHAR(100) PRIMARY KEY,
    property_id VARCHAR(100) REFERENCES properties(id) ON DELETE CASCADE,
    bidder_name VARCHAR(255) NOT NULL,
    bidder_email VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACCEPTED', 'OUTBID', 'REJECTED')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    avg_price_per_sqft NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_valuations (
    id SERIAL PRIMARY KEY,
    property_id VARCHAR(100) REFERENCES properties(id) ON DELETE CASCADE,
    predicted_price NUMERIC(10, 2) NOT NULL,
    rf_price NUMERIC(10, 2),
    xgb_price NUMERIC(10, 2),
    arima_1yr NUMERIC(10, 2),
    arima_3yr NUMERIC(10, 2),
    arima_5yr NUMERIC(10, 2),
    lstm_1yr NUMERIC(10, 2),
    lstm_3yr NUMERIC(10, 2),
    lstm_5yr NUMERIC(10, 2),
    investment_score INTEGER,
    expected_roi VARCHAR(50),
    rental_yield VARCHAR(50),
    gemini_insights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
