-- Seed data for Real Estate Valuation and Market Intelligence System

INSERT INTO users (name, email, role, password_hash) VALUES
('Rohan Sharma', 'buyer@example.com', 'Buyer', 'hashed_pass_buyer'),
('Apex Realty', 'seller@apexrealty.com', 'Seller', 'hashed_pass_seller'),
('Anand Mehta', 'investor@example.com', 'Investor', 'hashed_pass_investor')
ON CONFLICT (email) DO NOTHING;

-- Historical trends
INSERT INTO price_history (city, year, avg_price_per_sqft) VALUES
('Mumbai', 2015, 14200), ('Mumbai', 2020, 17400), ('Mumbai', 2026, 28800),
('Delhi NCR', 2015, 8500), ('Delhi NCR', 2020, 9600), ('Delhi NCR', 2026, 16400),
('Bangalore', 2015, 5100), ('Bangalore', 2020, 6800), ('Bangalore', 2026, 12700),
('Pune', 2015, 4800), ('Pune', 2020, 5900), ('Pune', 2026, 10200),
('Hyderabad', 2015, 3900), ('Hyderabad', 2020, 5850), ('Hyderabad', 2026, 12500),
('Chennai', 2015, 4900), ('Chennai', 2020, 5800), ('Chennai', 2026, 9300);
