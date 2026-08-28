"""
Master Training Pipeline Orchestrator for Real Estate ML Models
Trains & Evaluates:
 1. Random Forest Regressor
 2. XGBoost Regressor
 3. ARIMA Time-Series Forecaster
 4. LSTM Recurrent Neural Network Forecaster
Saves trained artifacts and metadata to ml/models/
"""

import os
import sys
import json

# Ensure ml directory is in sys.path
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

from training.train_random_forest import train_random_forest
from training.train_xgboost import train_xgboost
from training.train_arima import train_arima
from training.train_lstm import train_lstm

def train_and_save():
    print("=" * 70)
    print("      REAL ESTATE MACHINE LEARNING & TIME SERIES PIPELINE           ")
    print("=" * 70)

    rf_metrics = train_random_forest()
    xgb_metrics = train_xgboost()
    arima_metrics = train_arima()
    lstm_metrics = train_lstm()

    metadata = {
        "dataset": "ml/datasets/Dataset.csv",
        "models": {
            "Random_Forest": rf_metrics,
            "XGBoost": xgb_metrics,
            "ARIMA": arima_metrics,
            "LSTM": lstm_metrics
        },
        "Selected_Regression_Model": "XGBoost Regressor",
        "Selected_Forecasting_Model": "LSTM Neural Network",
        "summary": {
            "bestRegressorR2": xgb_metrics['R2'],
            "bestRegressorMAE": f"{xgb_metrics['MAE']} Lakhs INR",
            "bestForecasterR2": lstm_metrics['R2'],
            "bestForecasterMAPE": lstm_metrics['MAPE']
        }
    }

    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    metadata_path = os.path.join(models_dir, 'model_metadata.json')

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 70)
    print("TRAINING PIPELINE COMPLETE!")
    print(f"Model metadata & trained artifacts saved to: {models_dir}")
    print("=" * 70)

if __name__ == "__main__":
    train_and_save()
