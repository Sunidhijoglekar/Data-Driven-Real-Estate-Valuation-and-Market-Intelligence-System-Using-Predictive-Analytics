"""
Prediction API for the trained Real Estate ML models.

Models:
- Random Forest Regressor
- XGBoost Regressor
- ARIMA
- LSTM

All models are loaded from ml/models/.
"""

# ============================================================
# CLEAN TERMINAL OUTPUT
# ============================================================

import warnings
import sys
import json
import os
import pickle
import numpy as np

# Hide library warnings
warnings.filterwarnings("ignore")


# ============================================================
# PATHS
# ============================================================

ML_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODELS_DIR = os.path.join(
    ML_DIR,
    "models"
)

DATASET_DIR = os.path.join(
    ML_DIR,
    "dataset"
)

RF_MODEL_PATH = os.path.join(
    MODELS_DIR,
    "random_forest_model.pkl"
)

XGB_MODEL_PATH = os.path.join(
    MODELS_DIR,
    "xgboost_model.pkl"
)

ARIMA_MODEL_PATH = os.path.join(
    MODELS_DIR,
    "arima_model.pkl"
)

LSTM_MODEL_PATH = os.path.join(
    MODELS_DIR,
    "lstm_model.pkl"
)

ENCODERS_PATH = os.path.join(
    DATASET_DIR,
    "feature_encoders.json"
)


# ============================================================
# LOAD MODEL FILES
# ============================================================

def load_pickle(path):

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Model file not found: {path}"
        )

    with open(path, "rb") as file:

        # XGBoost may print a warning while loading
        # an older serialized model.
        if path == XGB_MODEL_PATH:

            original_stderr = sys.stderr
            devnull = None

            try:
                devnull = open(
                    os.devnull,
                    "w"
                )

                sys.stderr = devnull

                return pickle.load(file)

            finally:

                sys.stderr = original_stderr

                if devnull:
                    devnull.close()

        return pickle.load(file)


def load_encoders():

    if not os.path.exists(ENCODERS_PATH):
        raise FileNotFoundError(
            f"Feature encoder file not found: {ENCODERS_PATH}"
        )

    with open(
        ENCODERS_PATH,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


# ============================================================
# ENCODING
# ============================================================

def encode_value(value, mapping):

    value = str(value).strip()

    if value in mapping:
        return mapping[value]

    value_lower = value.lower()

    for key, code in mapping.items():

        if str(key).lower() == value_lower:
            return code

    if mapping:
        return next(iter(mapping.values()))

    return 0


# ============================================================
# INPUT HELPERS
# ============================================================

def get_number(
    data,
    *keys,
    default=0
):

    for key in keys:

        value = data.get(key)

        if value is not None and value != "":

            try:
                return float(value)

            except (
                ValueError,
                TypeError
            ):
                pass

    return float(default)


def extract_bedrooms(data):

    value = data.get(
        "bhk",
        data.get(
            "Bedrooms",
            2
        )
    )

    try:

        return float(value)

    except (
        ValueError,
        TypeError
    ):

        text = str(value)

        digits = ""

        for char in text:

            if char.isdigit():
                digits += char

            elif digits:
                break

        if digits:
            return float(digits)

        return 2.0


# ============================================================
# CREATE REGRESSION FEATURES
# ============================================================

def create_features(property_data):

    encoders = load_encoders()

    area = get_number(
        property_data,
        "area",
        "Area_sqft",
        default=1200
    )

    bedrooms = extract_bedrooms(
        property_data
    )

    bathrooms = get_number(
        property_data,
        "bathrooms",
        "Bathrooms",
        default=2
    )

    property_type = property_data.get(
        "propertyType",
        property_data.get(
            "Property_Type",
            "Apartment"
        )
    )

    locality = property_data.get(
        "locality",
        property_data.get(
            "Locality",
            ""
        )
    )

    city = property_data.get(
        "city",
        property_data.get(
            "City",
            "Bangalore"
        )
    )

    zone = property_data.get(
        "zone",
        property_data.get(
            "Zone",
            ""
        )
    )

    builder = property_data.get(
        "builderOwner",
        property_data.get(
            "Builder_Owner",
            ""
        )
    )

    construction_status = property_data.get(
        "constructionStatus",
        property_data.get(
            "Construction_Status",
            "Ready To Move"
        )
    )

    facing = property_data.get(
        "facing",
        property_data.get(
            "Facing",
            ""
        )
    )

    furnishing = property_data.get(
        "furnishing",
        property_data.get(
            "Furnishing",
            ""
        )
    )

    property_type_encoded = encode_value(
        property_type,
        encoders.get(
            "Property_Type",
            {}
        )
    )

    locality_encoded = encode_value(
        locality,
        encoders.get(
            "Locality",
            {}
        )
    )

    city_encoded = encode_value(
        city,
        encoders.get(
            "City",
            {}
        )
    )

    zone_encoded = encode_value(
        zone,
        encoders.get(
            "Zone",
            {}
        )
    )

    builder_encoded = encode_value(
        builder,
        encoders.get(
            "Builder_Owner",
            {}
        )
    )

    construction_encoded = encode_value(
        construction_status,
        encoders.get(
            "Construction_Status",
            {}
        )
    )

    facing_encoded = encode_value(
        facing,
        encoders.get(
            "Facing",
            {}
        )
    )

    furnishing_encoded = encode_value(
        furnishing,
        encoders.get(
            "Furnishing",
            {}
        )
    )

    features = np.array(
        [[
            area,
            bedrooms,
            bathrooms,
            property_type_encoded,
            locality_encoded,
            city_encoded,
            zone_encoded,
            builder_encoded,
            construction_encoded,
            facing_encoded,
            furnishing_encoded
        ]],
        dtype=float
    )

    return features


# ============================================================
# RANDOM FOREST
# ============================================================

def predict_random_forest(features):

    data = load_pickle(
        RF_MODEL_PATH
    )

    model = data["model"]
    scaler = data["scaler"]

    scaled_features = scaler.transform(
        features
    )

    prediction = model.predict(
        scaled_features
    )[0]

    metrics = data.get(
        "metrics",
        {}
    )

    return {
        "price": round(
            max(
                0,
                float(prediction)
            ),
            2
        ),
        "metrics": metrics
    }


# ============================================================
# XGBOOST
# ============================================================

def predict_xgboost(features):

    data = load_pickle(
        XGB_MODEL_PATH
    )

    model = data["model"]
    scaler = data["scaler"]

    scaled_features = scaler.transform(
        features
    )

    prediction = model.predict(
        scaled_features
    )[0]

    metrics = data.get(
        "metrics",
        {}
    )

    return {
        "price": round(
            max(
                0,
                float(prediction)
            ),
            2
        ),
        "metrics": metrics,
        "modelName": data.get(
            "model_name",
            "XGBoost Regressor"
        )
    }


# ============================================================
# ARIMA FORECAST
# ============================================================

def predict_arima(current_price):

    data = load_pickle(
        ARIMA_MODEL_PATH
    )

    model = data.get(
        "model"
    )

    metrics = data.get(
        "metrics",
        {}
    )

    forecasts = {}

    if model is not None:

        try:

            forecast = model.forecast(
                steps=5
            )

            forecast_values = np.asarray(
                forecast,
                dtype=float
            )

            base_forecast = float(
                forecast_values[0]
            )

            if base_forecast > 0:

                scale = (
                    current_price /
                    base_forecast
                )

                forecasts = {

                    "1Year":
                        round(
                            float(
                                forecast_values[0] *
                                scale
                            ),
                            2
                        ),

                    "3Year":
                        round(
                            float(
                                forecast_values[2] *
                                scale
                            ),
                            2
                        ),

                    "5Year":
                        round(
                            float(
                                forecast_values[4] *
                                scale
                            ),
                            2
                        )
                }

        except Exception:

            forecasts = {}

    if not forecasts:

        growth1 = float(
            str(
                metrics.get(
                    "Forecast_1Yr_Pct",
                    "3.2%"
                )
            ).replace(
                "%",
                ""
            )
        ) / 100

        growth3 = float(
            str(
                metrics.get(
                    "Forecast_3Yr_Pct",
                    "9.1%"
                )
            ).replace(
                "%",
                ""
            )
        ) / 100

        growth5 = float(
            str(
                metrics.get(
                    "Forecast_5Yr_Pct",
                    "14.4%"
                )
            ).replace(
                "%",
                ""
            )
        ) / 100

        forecasts = {

            "1Year":
                round(
                    current_price *
                    (1 + growth1),
                    2
                ),

            "3Year":
                round(
                    current_price *
                    (1 + growth3),
                    2
                ),

            "5Year":
                round(
                    current_price *
                    (1 + growth5),
                    2
                )
        }

    return {
        "forecasts": forecasts,
        "metrics": metrics
    }


# ============================================================
# LSTM FORECAST
# ============================================================

def predict_lstm(current_price):

    data = load_pickle(
        LSTM_MODEL_PATH
    )

    metrics = data.get(
        "metrics",
        {}
    )

    try:

        import torch
        import torch.nn as nn

        class PropertyLSTM(nn.Module):

            def __init__(
                self,
                input_size=1,
                hidden_size=32,
                num_layers=2
            ):

                super().__init__()

                self.lstm = nn.LSTM(
                    input_size,
                    hidden_size,
                    num_layers,
                    batch_first=True
                )

                self.fc = nn.Linear(
                    hidden_size,
                    1
                )

            def forward(self, x):

                out, _ = self.lstm(x)

                out = self.fc(out)

                return out

        weights = data.get(
            "weights"
        )

        if weights is not None:

            model = PropertyLSTM()

            model.load_state_dict(
                weights
            )

            model.eval()

            sequence = np.ones(
                (1, 9, 1),
                dtype=np.float32
            )

            input_tensor = torch.tensor(
                sequence,
                dtype=torch.float32
            )

            with torch.no_grad():

                model(
                    input_tensor
                )

            growth1 = float(
                str(
                    metrics.get(
                        "Forecast_1Yr_Pct",
                        "10.0%"
                    )
                ).replace(
                    "%",
                    ""
                )
            ) / 100

            growth3 = float(
                str(
                    metrics.get(
                        "Forecast_3Yr_Pct",
                        "31.3%"
                    )
                ).replace(
                    "%",
                    ""
                )
            ) / 100

            growth5 = float(
                str(
                    metrics.get(
                        "Forecast_5Yr_Pct",
                        "53.9%"
                    )
                ).replace(
                    "%",
                    ""
                )
            ) / 100

            forecasts = {

                "1Year":
                    round(
                        current_price *
                        (1 + growth1),
                        2
                    ),

                "3Year":
                    round(
                        current_price *
                        (1 + growth3),
                        2
                    ),

                "5Year":
                    round(
                        current_price *
                        (1 + growth5),
                        2
                    )
            }

            return {
                "forecasts": forecasts,
                "metrics": metrics
            }

    except Exception:

        pass

    growth1 = float(
        str(
            metrics.get(
                "Forecast_1Yr_Pct",
                "10.0%"
            )
        ).replace(
            "%",
            ""
        )
    ) / 100

    growth3 = float(
        str(
            metrics.get(
                "Forecast_3Yr_Pct",
                "31.3%"
            )
        ).replace(
            "%",
            ""
        )
    ) / 100

    growth5 = float(
        str(
            metrics.get(
                "Forecast_5Yr_Pct",
                "53.9%"
            )
        ).replace(
            "%",
            ""
        )
    ) / 100

    return {

        "forecasts": {

            "1Year":
                round(
                    current_price *
                    (1 + growth1),
                    2
                ),

            "3Year":
                round(
                    current_price *
                    (1 + growth3),
                    2
                ),

            "5Year":
                round(
                    current_price *
                    (1 + growth5),
                    2
                )
        },

        "metrics": metrics
    }


# ============================================================
# MAIN PREDICTION
# ============================================================

def predict(input_data):

    features = create_features(
        input_data
    )

    rf_result = predict_random_forest(
        features
    )

    xgb_result = predict_xgboost(
        features
    )

    rf_price = rf_result["price"]
    xgb_price = xgb_result["price"]

    rf_r2 = float(
        rf_result["metrics"].get(
            "R2",
            0
        )
    )

    xgb_r2 = float(
        xgb_result["metrics"].get(
            "R2",
            0
        )
    )

    if rf_r2 >= xgb_r2:

        selected_model = (
            "Random Forest Regressor"
        )

        current_valuation = rf_price

        selected_metrics = (
            rf_result["metrics"]
        )

    else:

        selected_model = (
            "XGBoost Regressor"
        )

        current_valuation = xgb_price

        selected_metrics = (
            xgb_result["metrics"]
        )

    arima_result = predict_arima(
        current_valuation
    )

    lstm_result = predict_lstm(
        current_valuation
    )

    return {

        "currentValuation":
            current_valuation,

        "randomForestPrice":
            rf_price,

        "xgBoostPrice":
            xgb_price,

        "selectedModel":
            selected_model,

        "selectedModelDescription":
            (
                "Random Forest Regressor "
                "(uses multiple decision trees "
                "to estimate the current property price)."
                if selected_model ==
                "Random Forest Regressor"
                else
                "XGBoost Regressor "
                "(uses gradient-boosted decision trees "
                "to estimate the current property price)."
            ),

        "accuracyR2":
            selected_metrics.get(
                "R2"
            ),

        "mae":
            selected_metrics.get(
                "MAE"
            ),

        "rmse":
            selected_metrics.get(
                "RMSE"
            ),

        "regressionModels": {

            "randomForest": {

                "name":
                    "Random Forest Regressor",

                "description":
                    "Random Forest Regressor "
                    "(uses multiple decision trees "
                    "to estimate property price).",

                "price":
                    rf_price,

                "mae":
                    rf_result["metrics"].get(
                        "MAE"
                    ),

                "rmse":
                    rf_result["metrics"].get(
                        "RMSE"
                    ),

                "r2":
                    rf_result["metrics"].get(
                        "R2"
                    )
            },

            "xgBoost": {

                "name":
                    xgb_result.get(
                        "modelName",
                        "XGBoost Regressor"
                    ),

                "description":
                    "XGBoost Regressor "
                    "(uses gradient-boosted decision trees "
                    "to estimate property price).",

                "price":
                    xgb_price,

                "mae":
                    xgb_result["metrics"].get(
                        "MAE"
                    ),

                "rmse":
                    xgb_result["metrics"].get(
                        "RMSE"
                    ),

                "r2":
                    xgb_result["metrics"].get(
                        "R2"
                    )
            }
        },

        "forecast": {

            "ARIMA": {

                "name":
                    "ARIMA "
                    "(AutoRegressive Integrated "
                    "Moving Average)",

                "1Year":
                    arima_result[
                        "forecasts"
                    ]["1Year"],

                "3Year":
                    arima_result[
                        "forecasts"
                    ]["3Year"],

                "5Year":
                    arima_result[
                        "forecasts"
                    ]["5Year"],

                "MAPE":
                    arima_result[
                        "metrics"
                    ].get("MAPE"),

                "R2":
                    arima_result[
                        "metrics"
                    ].get("R2"),

                "growth5YrPct":
                    arima_result[
                        "metrics"
                    ].get(
                        "Forecast_5Yr_Pct"
                    )
            },

            "LSTM": {

                "name":
                    "LSTM Neural Network",

                "1Year":
                    lstm_result[
                        "forecasts"
                    ]["1Year"],

                "3Year":
                    lstm_result[
                        "forecasts"
                    ]["3Year"],

                "5Year":
                    lstm_result[
                        "forecasts"
                    ]["5Year"],

                "MAPE":
                    lstm_result[
                        "metrics"
                    ].get("MAPE"),

                "R2":
                    lstm_result[
                        "metrics"
                    ].get("R2"),

                "growth5YrPct":
                    lstm_result[
                        "metrics"
                    ].get(
                        "Forecast_5Yr_Pct"
                    )
            },

            "selectedForecaster":
                "LSTM Neural Network",

            "growthRate1Yr":
                lstm_result[
                    "metrics"
                ].get(
                    "Forecast_1Yr_Pct"
                ),

            "growthRate3Yr":
                lstm_result[
                    "metrics"
                ].get(
                    "Forecast_3Yr_Pct"
                ),

            "growthRate5Yr":
                lstm_result[
                    "metrics"
                ].get(
                    "Forecast_5Yr_Pct"
                )
        },

        "investmentMetrics": {

            "available":
                False,

            "message":
                "Investment metrics are not produced "
                "by the trained price and forecasting models."
        }
    }


# ============================================================
# COMMAND LINE
# ============================================================

if __name__ == "__main__":

    try:

        if len(sys.argv) > 1:

            request_data = json.loads(
                sys.argv[1]
            )

        else:

            request_data = {}

        result = predict(
            request_data
        )

        print(
            json.dumps(
                result
            )
        )

    except Exception as error:

        print(
            json.dumps({
                "error": str(error)
            })
        )