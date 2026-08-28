import csv
import json
import os
import re

# File paths
CSV_PATH_1 = os.path.join(os.path.dirname(__file__), 'datasets/Dataset.csv')
PROPERTIES_JSON_PATH = os.path.join(os.path.dirname(__file__), 'datasets/current_properties.json')
HISTORICAL_JSON_PATH = os.path.join(os.path.dirname(__file__), 'datasets/historical_price_trends.json')

def process_csv_file(csv_file):
    properties = []
    locality_trends = {}
    city_trends = {"Bangalore": {str(y): [] for y in range(2016, 2026)}}

    with open(csv_file, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        idx = 0
        for row in reader:
            idx += 1
            rec_num = row.get('Record Number', str(idx)).strip()
            title = row.get('Property Title', '').strip() or row.get('Listing Title', '').strip() or row.get('Project Name', '').strip() or f"Property #{rec_num}"
            prop_type = row.get('Property Type', '').strip() or row.get('Configuration', 'Apartment').strip()
            
            # Historical Prices
            p2016 = parse_number(row.get('Estimated Market Price 2016 (₹)', 0))
            p2017 = parse_number(row.get('Estimated Market Price 2017 (₹)', 0))
            p2018 = parse_number(row.get('Estimated Market Price 2018 (₹)', 0))
            p2019 = parse_number(row.get('Estimated Market Price 2019 (₹)', 0))
            p2020 = parse_number(row.get('Estimated Market Price 2020 (₹)', 0))
            p2021 = parse_number(row.get('Estimated Market Price 2021 (₹)', 0))
            p2022 = parse_number(row.get('Estimated Market Price 2022 (₹)', 0))
            p2023 = parse_number(row.get('Estimated Market Price 2023 (₹)', 0))
            p2024 = parse_number(row.get('Estimated Market Price 2024 (₹)', 0))
            p2025 = parse_number(row.get('Estimated Market Price 2025 (₹)', 0))

            price_lakhs = parse_price_in_lakhs(row.get('Price', ''), p2025)
            area_sqft = parse_area(row.get('Area', ''))
            bhk = parse_int(row.get('Bedrooms', ''), 3 if '3 BHK' in prop_type else (2 if '2 BHK' in prop_type else (4 if '4 BHK' in prop_type or '4 Bedroom' in prop_type else 2)))
            baths = parse_int(row.get('Bathrooms', ''), bhk)
            
            locality = row.get('Locality', '').strip()
            if not locality or locality == 'N/A':
                locality = extract_locality_from_title(title, row.get('Listing Title', ''))
            
            city = row.get('City', 'Bangalore').strip()
            if not city or city == 'N/A':
                city = 'Bangalore'
                
            zone = row.get('Zone', 'East').strip()
            if not zone or zone == 'N/A':
                zone = 'East' if 'East' in title else ('North' if 'North' in title else ('South' if 'South' in title else 'West'))

            builder = row.get('Builder / Owner', '').strip() or row.get('Project Name', 'Reputed Builder').strip()
            if builder == 'N/A':
                builder = 'Premier Developers'

            constr_status = row.get('Construction Status', 'Ready To Move').strip()
            rera_status = row.get('RERA Status', 'Yes').strip()
            price_sqft = parse_number(row.get('Price / Sqft', 0))
            if price_sqft == 0 and area_sqft > 0:
                price_sqft = round((price_lakhs * 100000) / area_sqft, 0)

            img = get_valid_image(row, idx)

            # Description
            desc = row.get('Description', '').strip()
            if not desc or desc == 'N/A':
                desc = f"{bhk} BHK property in {locality}, {city}. Features modern construction, excellent connectivity, and premium neighborhood amenities."

            # Auction configuration (seed ~25% as auction-enabled)
            is_auction = (idx % 4 == 0)
            start_price = round(price_lakhs * 0.9, 2) if is_auction else price_lakhs

            prop_item = {
                "id": f"prop-{rec_num}",
                "recordNumber": rec_num,
                "listingId": row.get('Listing ID', f"LST-{rec_num}").strip(),
                "title": title,
                "name": title,
                "listingTitle": row.get('Listing Title', title).strip(),
                "propertyType": prop_type,
                "configuration": row.get('Configuration', f"{bhk} BHK").strip(),
                "bhk": bhk,
                "bathrooms": baths,
                "price": price_lakhs,
                "priceRange4BHK": row.get('Price Range (4 BHK)', 'N/A').strip(),
                "priceRange5BHK": row.get('Price Range (5 BHK)', 'N/A').strip(),
                "area": area_sqft,
                "areaType": row.get('Area Type', 'Super Built-up Area').strip(),
                "locality": locality,
                "city": city,
                "zone": zone,
                "address": row.get('Address', f"{locality}, {city}").strip(),
                "postalCode": row.get('Postal Code', '560001').strip(),
                "projectName": row.get('Project Name', title).strip(),
                "builder": builder,
                "seller": builder,
                "sellerType": row.get('Seller Type', 'Owner').strip(),
                "brokerageType": row.get('Brokerage Type', 'No Brokerage').strip(),
                "constructionStatus": constr_status,
                "reraStatus": rera_status,
                "listingAge": row.get('Listing Age', '1w ago').strip(),
                "age": "1-5 yrs" if constr_status == 'Ready To Move' else "<1 yr",
                "ageYears": 3.0 if constr_status == 'Ready To Move' else 0.5,
                "floor": row.get('Floor', 'N/A').strip(),
                "totalFloors": row.get('Total Floors', 'N/A').strip(),
                "parking": row.get('Parking', 'Covered').strip(),
                "facing": row.get('Facing', 'East').strip(),
                "furnishing": row.get('Furnishing', 'Semi-Furnished').strip(),
                "priceSqft": price_sqft,
                "amenities": ["Clubhouse", "Gymnasium", "Swimming Pool", "Power Backup", "24x7 Security", "Children's Play Area"],
                "specialFeatures": row.get('Special Features', 'Vastu Compliant').strip(),
                "description": desc,
                "image": img,
                "lat": 12.9716 + ((idx * 17) % 100) * 0.002 - 0.1,
                "lng": 77.5946 + ((idx * 23) % 100) * 0.002 - 0.1,
                "sellerEmail": f"seller{(idx%5)+1}@apexrealty.com",
                "auctionEnabled": is_auction,
                "startingPrice": start_price,
                "minIncrement": 1.0,
                "auctionEnd": None,
                "bids": [],
                "historicalPrices": {
                    "2016": p2016, "2017": p2017, "2018": p2018, "2019": p2019,
                    "2020": p2020, "2021": p2021, "2022": p2022, "2023": p2023,
                    "2024": p2024, "2025": p2025
                }
            }

            properties.append(prop_item)

            # Collect historical trend for locality
            if locality not in locality_trends:
                locality_trends[locality] = {str(y): [] for y in range(2016, 2026)}

            for yr, pval in zip(range(2016, 2026), [p2016, p2017, p2018, p2019, p2020, p2021, p2022, p2023, p2024, p2025]):
                if pval > 0:
                    locality_trends[locality][str(yr)].append(pval)
                    if city in city_trends:
                        city_trends[city][str(yr)].append(pval)

    # Save properties.json
    with open(PROPERTIES_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(properties, f, indent=2)

    # Build historical_price_trends.json
    locality_averages = {}
    for loc, yrs in locality_trends.items():
        locality_averages[loc] = {}
        for yr, p_list in yrs.items():
            if p_list:
                locality_averages[loc][yr] = round(sum(p_list) / len(p_list), 0)

    city_averages = {}
    for cty, yrs in city_trends.items():
        city_averages[cty] = {}
        for yr, p_list in yrs.items():
            if p_list:
                city_averages[cty][yr] = round(sum(p_list) / len(p_list), 0)

    historical_summary = {
        "cityAveragePriceINR": city_averages,
        "localityPriceTrendsINR": locality_averages,
        "years": [str(y) for y in range(2016, 2026)],
        "datasetCount": len(properties)
    }

    with open(HISTORICAL_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(historical_summary, f, indent=2)

    print(f"Successfully processed {len(properties)} properties from {csv_file}")
    print(f"Saved properties to: {PROPERTIES_JSON_PATH}")
    print(f"Saved historical trends to: {HISTORICAL_JSON_PATH}")

def parse_price_in_lakhs(price_str, p2025=0):
    if not price_str or price_str == 'N/A' or 'Request' in str(price_str):
        if p2025 and p2025 > 0:
            return round(p2025 / 100000, 2)
        return 120.0

    cleaned = str(price_str).replace('₹', '').replace(',', '').strip()
    is_cr = 'Cr' in cleaned or 'crore' in cleaned.lower()
    is_lac = 'Lac' in cleaned or 'L' in cleaned or 'lakh' in cleaned.lower()

    nums = [float(x) for x in re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)]
    if not nums:
        if p2025 and p2025 > 0:
            return round(p2025 / 100000, 2)
        return 120.0

    avg_num = sum(nums) / len(nums)
    if is_cr:
        return round(avg_num * 100, 2) # Cr to Lakhs
    elif is_lac:
        return round(avg_num, 2)
    else:
        if avg_num < 100:
            return round(avg_num * 100, 2)
        elif avg_num > 100000:
            return round(avg_num / 100000, 2)
        return round(avg_num, 2)

def parse_area(area_str):
    if not area_str or area_str == 'N/A':
        return 1200.0
    cleaned = str(area_str).replace('sqft', '').replace('sq.ft', '').replace(',', '').strip()
    nums = [float(x) for x in re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)]
    if not nums:
        return 1200.0
    avg_area = sum(nums) / len(nums)
    if avg_area > 100000:
        return 2400.0
    return round(avg_area, 1)

def parse_int(val, default=2):
    try:
        if not val or val == 'N/A':
            return default
        return int(float(str(val).replace(',', '').strip()))
    except:
        return default

def parse_number(val):
    try:
        if not val or val == 'N/A':
            return 0
        cleaned = str(val).replace('₹', '').replace(',', '').replace('/sqft', '').strip()
        nums = [float(x) for x in re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)]
        return float(nums[0]) if nums else 0
    except:
        return 0

def extract_locality_from_title(title, listing_title):
    full = f"{title} {listing_title}"
    match = re.search(r'in\s+([^,]+)', full, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return "Whitefield"

def get_valid_image(row_dict, idx):
    fallback_images = [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80"
    ]
    for key in ['Image URL 1', 'Images URL', 'Image URL 2', 'Image URL 3']:
        val = row_dict.get(key, '')
        if val and str(val).startswith('http') and ('static' in str(val) or 'imagecdn' in str(val) or 'newprojects' in str(val)):
            return str(val).split('|')[0].strip()
    return fallback_images[idx % len(fallback_images)]

if __name__ == '__main__':
    if os.path.exists(CSV_PATH_1):
        process_csv_file(CSV_PATH_1)
    else:
        print("No CSV found at", CSV_PATH_1)
