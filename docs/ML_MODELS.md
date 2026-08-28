# Machine Learning Models & Pipeline

## Model Performance Summary

| Model | Type | Metric | Score / Accuracy |
| :--- | :--- | :--- | :--- |
| **XGBoost Regressor** | Price Valuation | R² Score | **0.9635** |
| **Random Forest** | Price Valuation | R² Score | **0.9412** |
| **LSTM Neural Net** | Time Series Forecast | R² Score | **0.9780** |
| **ARIMA** | Time Series Forecast | MAPE | **4.12%** |

## Folder Structure

- `ml/datasets/`: Dataset storage (`Dataset.csv`, `current_properties.json`, `historical_price_trends.json`)
- `ml/preprocessing/`: Data cleaning (`data_cleaner.py`) and categorical feature encoding (`feature_encoder.py`)
- `ml/training/`: Training modules for Random Forest, XGBoost, ARIMA, and LSTM
- `ml/prediction/`: API interface (`prediction_api.py`)
- `ml/models/`: Exported model metadata (`model_metadata.json`)
- `ml/evaluation/`: Metric evaluation helpers (`metrics.py`)
