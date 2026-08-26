"""
Training Script: Random Forest Regressor
Target: Property Price Prediction (in Lakhs INR)
Input Dataset: ml/datasets/Dataset.csv
Saved Model: ml/models/random_forest_model.pkl
"""

import os
import sys
import json
import pickle
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure ml directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.feature_encoder import load_and_encode_features

def train_random_forest():
    print("=" * 60)
    print("Training Random Forest Regressor Model...")
    print("=" * 60)

    data = load_and_encode_features()
    X = data['X_scaled']
    y = data['y']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )

    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"Random Forest Performance:")
    print(f"  MAE  : {mae:.2f} Lakhs INR")
    print(f"  RMSE : {rmse:.2f} Lakhs INR")
    print(f"  R^2  : {r2:.4f}")

    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, 'random_forest_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': rf,
            'scaler': data['scaler'],
            'feature_cols': data['feature_cols'],
            'metrics': {'MAE': round(mae, 2), 'RMSE': round(rmse, 2), 'R2': round(r2, 4)}
        }, f)

    print(f"Successfully saved Random Forest model to: {model_path}")
    return {'MAE': round(mae, 2), 'RMSE': round(rmse, 2), 'R2': round(r2, 4)}

if __name__ == '__main__':
    train_random_forest()
