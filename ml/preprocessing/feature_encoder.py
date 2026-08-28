"""
Feature Encoding and Scaling Module for Real Estate ML Pipeline
Encodes categorical features and prepares training matrices for Regressors (Random Forest, XGBoost)
and Time-Series Forecasters (ARIMA, LSTM).
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from preprocessing.data_cleaner import clean_raw_dataset

def load_and_encode_features():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cleaned_csv = os.path.join(base_dir, 'dataset', 'cleaned_dataset.csv')
    
    if not os.path.exists(cleaned_csv):
        df = clean_raw_dataset()
    else:
        df = pd.read_csv(cleaned_csv)

    print(f"Loaded {len(df)} records for feature encoding.")

    encoders = {}
    categorical_cols = ['Property_Type', 'Locality', 'City', 'Zone', 'Builder_Owner', 'Construction_Status', 'Facing', 'Furnishing']
    
    encoded_df = df.copy()
    for col in categorical_cols:
        le = LabelEncoder()
        encoded_df[f'{col}_Encoded'] = le.fit_transform(encoded_df[col].astype(str))
        encoders[col] = {str(class_name): int(code) for class_name, code in zip(le.classes_, range(len(le.classes_)))}

    feature_cols = ['Area_sqft', 'Bedrooms', 'Bathrooms'] + [f'{col}_Encoded' for col in categorical_cols]
    X = encoded_df[feature_cols].values
    y = encoded_df['Price_in_Lakhs_INR'].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Time series price sequences 2016-2025
    ts_cols = [f'Price_{year}_INR' for year in range(2016, 2026)]
    time_series_matrix = encoded_df[ts_cols].values # shape: (N, 10)

    # Save encoded mappings and metadata
    metadata_dir = os.path.join(base_dir, 'dataset')
    encoders_path = os.path.join(metadata_dir, 'feature_encoders.json')
    with open(encoders_path, 'w') as f:
        json.dump(encoders, f, indent=2)

    print(f"Feature Encoding complete!")
    print(f"Feature Matrix X Shape: {X.shape}, Target y Shape: {y.shape}")
    print(f"Time Series Price Sequences Shape: {time_series_matrix.shape}")
    print(f"Encoders saved to: {encoders_path}")

    return {
        'X': X,
        'X_scaled': X_scaled,
        'y': y,
        'time_series_matrix': time_series_matrix,
        'feature_cols': feature_cols,
        'encoders': encoders,
        'scaler': scaler,
        'df': df
    }

if __name__ == '__main__':
    load_and_encode_features()
