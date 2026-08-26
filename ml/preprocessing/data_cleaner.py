"""
Data Cleaning Module for Real Estate Dataset (Dataset.csv)
"""

import os
import re
import csv
import pandas as pd
import numpy as np

def get_dataset_path():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    primary_path = os.path.join(base_dir, 'datasets', 'Dataset.csv')
    secondary_path = os.path.join(base_dir, 'dataset', 'Dataset.csv')
    if os.path.exists(primary_path):
        return primary_path
    elif os.path.exists(secondary_path):
        return secondary_path
    return primary_path

def clean_price(price_str, price_2025=0):
    if pd.isna(price_str) or not str(price_str).strip() or str(price_str) == 'N/A' or 'Request' in str(price_str):
        if price_2025 > 0:
            return round(float(price_2025) / 100000.0, 2)
        return np.nan

    cleaned = str(price_str).replace('₹', '').replace(',', '').strip()
    is_cr = 'Cr' in cleaned or 'crore' in cleaned.lower()
    is_lac = 'Lac' in cleaned or 'L' in cleaned or 'lakh' in cleaned.lower()

    nums = [float(x) for x in re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)]
    if not nums:
        if price_2025 > 0:
            return round(float(price_2025) / 100000.0, 2)
        return np.nan

    avg_num = sum(nums) / len(nums)
    if is_cr:
        return round(avg_num * 100, 2) # Cr -> Lakhs
    elif is_lac:
        return round(avg_num, 2)
    else:
        if avg_num < 100:
            return round(avg_num * 100, 2)
        elif avg_num > 100000:
            return round(avg_num / 100000.0, 2)
        return round(avg_num, 2)

def clean_area(area_str):
    if pd.isna(area_str) or not str(area_str).strip() or str(area_str) == 'N/A':
        return np.nan
    cleaned = str(area_str).replace('sqft', '').replace('sq.ft', '').replace(',', '').strip()
    nums = [float(x) for x in re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)]
    if not nums:
        return np.nan
    avg_area = sum(nums) / len(nums)
    if avg_area > 100000: # handle total square feet anomalies
        return np.nan
    return round(avg_area, 1)

def clean_number(val):
    if pd.isna(val) or not str(val).strip() or str(val) == 'N/A':
        return np.nan
    try:
        cleaned = str(val).replace('₹', '').replace(',', '').replace('/sqft', '').strip()
        nums = [float(x) for x in re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)]
        return float(nums[0]) if nums else np.nan
    except:
        return np.nan

def clean_raw_dataset(input_csv=None, output_csv=None):
    if input_csv is None:
        input_csv = get_dataset_path()
    
    if output_csv is None:
        output_csv = os.path.join(os.path.dirname(input_csv), '../dataset/cleaned_dataset.csv')

    print(f"Loading raw dataset from: {input_csv}")
    
    try:
        df = pd.read_csv(input_csv)
    except Exception as e:
        print(f"Error reading CSV with pandas: {e}. Retrying with csv module...")
        rows = []
        with open(input_csv, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows.append(r)
        df = pd.DataFrame(rows)

    print(f"Original Raw Dataset Shape: {df.shape}")

    cleaned_df = pd.DataFrame()
    cleaned_df['Record_Number'] = df.get('Record Number', range(1, len(df)+1))
    cleaned_df['Listing_ID'] = df.get('Listing ID', 'N/A').fillna('N/A')
    cleaned_df['Property_Title'] = df.get('Property Title', 'N/A').fillna('N/A')
    cleaned_df['Property_Type'] = df.get('Property Type', 'Apartment').fillna('Apartment')
    cleaned_df['Configuration'] = df.get('Configuration', '2 BHK').fillna('2 BHK')
    
    # Clean numeric columns
    cleaned_df['Price_2025_INR'] = df.get('Estimated Market Price 2025 (₹)', 0).apply(clean_number).fillna(0)
    cleaned_df['Price_in_Lakhs_INR'] = [clean_price(p, p25) for p, p25 in zip(df.get('Price', ''), cleaned_df['Price_2025_INR'])]
    cleaned_df['Area_sqft'] = df.get('Area', '').apply(clean_area)
    cleaned_df['Bedrooms'] = df.get('Bedrooms', np.nan).apply(clean_number)
    cleaned_df['Bathrooms'] = df.get('Bathrooms', np.nan).apply(clean_number)
    cleaned_df['Price_per_Sqft'] = df.get('Price / Sqft', np.nan).apply(clean_number)

    # Impute missing bedrooms & bathrooms
    cleaned_df['Bedrooms'] = cleaned_df['Bedrooms'].fillna(2).astype(int)
    cleaned_df['Bathrooms'] = cleaned_df['Bathrooms'].fillna(cleaned_df['Bedrooms']).astype(int)
    
    # Impute missing area based on bedrooms
    area_medians = {1: 650, 2: 1100, 3: 1550, 4: 2400, 5: 3500}
    cleaned_df['Area_sqft'] = cleaned_df.apply(
        lambda r: area_medians.get(r['Bedrooms'], 1200) if pd.isna(r['Area_sqft']) or r['Area_sqft'] <= 0 else r['Area_sqft'],
        axis=1
    )

    # Impute missing Price_in_Lakhs_INR
    cleaned_df['Price_in_Lakhs_INR'] = cleaned_df['Price_in_Lakhs_INR'].fillna(
        cleaned_df['Area_sqft'] * 8500 / 100000.0
    )

    # Clean location columns
    cleaned_df['Locality'] = df.get('Locality', 'Whitefield').fillna('Whitefield').replace('N/A', 'Whitefield')
    cleaned_df['City'] = df.get('City', 'Bangalore').fillna('Bangalore').replace('N/A', 'Bangalore')
    cleaned_df['Zone'] = df.get('Zone', 'East').fillna('East').replace('N/A', 'East')
    cleaned_df['Builder_Owner'] = df.get('Builder / Owner', 'Premier Developers').fillna('Premier Developers').replace('N/A', 'Premier Developers')
    cleaned_df['Construction_Status'] = df.get('Construction Status', 'Ready To Move').fillna('Ready To Move').replace('N/A', 'Ready To Move')
    cleaned_df['RERA_Status'] = df.get('RERA Status', 'Yes').fillna('Yes').replace('N/A', 'Yes')
    cleaned_df['Facing'] = df.get('Facing', 'East').fillna('East').replace('N/A', 'East')
    cleaned_df['Furnishing'] = df.get('Furnishing', 'Semi-Furnished').fillna('Semi-Furnished').replace('N/A', 'Semi-Furnished')

    # Historical Prices 2016-2025
    for year in range(2016, 2026):
        col_name = f'Estimated Market Price {year} (₹)'
        cleaned_df[f'Price_{year}_INR'] = df.get(col_name, 0).apply(clean_number).fillna(0)

    # Impute missing historical prices using growth ratios if necessary
    for year in range(2016, 2025):
        ratio = (year - 2015) / 10.0
        cleaned_df[f'Price_{year}_INR'] = cleaned_df.apply(
            lambda r: r[f'Price_{year}_INR'] if r[f'Price_{year}_INR'] > 0 else round(r['Price_2025_INR'] * (0.6 + 0.4 * ratio), 0),
            axis=1
        )

    # Save cleaned dataset
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    cleaned_df.to_csv(output_csv, index=False)
    print(f"Data cleaning complete! Cleaned dataset saved to: {output_csv}")
    print(f"Cleaned Dataset Shape: {cleaned_df.shape}")
    
    return cleaned_df

if __name__ == '__main__':
    clean_raw_dataset()
