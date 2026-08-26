"""
Evaluation Metrics Module for Real Estate Valuation (MAE, RMSE, R2 Score)
"""

import numpy as np

def calculate_mae(y_true, y_pred):
    return float(np.mean(np.abs(y_true - y_pred)))

def calculate_rmse(y_true, y_pred):
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def calculate_r2(y_true, y_pred):
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    if ss_tot == 0:
        return 1.0
    return float(1 - (ss_res / ss_tot))

def evaluate_models(y_true, rf_pred, xgb_pred):
    rf_mae = calculate_mae(y_true, rf_pred)
    rf_rmse = calculate_rmse(y_true, rf_pred)
    rf_r2 = calculate_r2(y_true, rf_pred)

    xgb_mae = calculate_mae(y_true, xgb_pred)
    xgb_rmse = calculate_rmse(y_true, xgb_pred)
    xgb_r2 = calculate_r2(y_true, xgb_pred)

    better_model = "XGBoost Regressor" if xgb_r2 > rf_r2 else "Random Forest Regressor"

    return {
        "Random Forest Regressor": {"MAE": round(rf_mae, 2), "RMSE": round(rf_rmse, 2), "R2": round(rf_r2, 4)},
        "XGBoost Regressor": {"MAE": round(xgb_mae, 2), "RMSE": round(xgb_rmse, 2), "R2": round(xgb_r2, 4)},
        "Selected_Model": better_model
    }
