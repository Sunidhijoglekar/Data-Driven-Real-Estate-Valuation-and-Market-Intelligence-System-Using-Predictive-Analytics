/**
 * ML Controller
 *
 * Connects the Node.js backend with the trained Python ML models.
 *
 * Models:
 * - Random Forest Regressor
 * - XGBoost Regressor
 * - ARIMA
 * - LSTM
 *
 * Python model entry point:
 * ml/prediction/prediction_api.py
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

import { db } from '../database/db.js';


// ============================================================
// PATH CONFIGURATION
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '../..');

const predictionScript = path.join(
  projectRoot,
  'ml',
  'prediction',
  'prediction_api.py'
);


// ============================================================
// RUN PYTHON TRAINED ML MODELS
// ============================================================

function runPythonPrediction(propertyData) {

  return new Promise((resolve, reject) => {

    const input = JSON.stringify(propertyData || {});

    /*
     * -W ignore suppresses Python warning messages such as:
     * sklearn version warnings
     * XGBoost serialization warnings
     * statsmodels index warnings
     *
     * The actual JSON prediction remains clean.
     */

    execFile(
      process.env.PYTHON_PATH || 'python',
      [
        '-W',
        'ignore',
        predictionScript,
        input
      ],
      {
        maxBuffer: 20 * 1024 * 1024,
        windowsHide: true
      },

      (error, stdout, stderr) => {

        if (error) {

          console.error(
            'Python ML prediction failed:',
            error.message
          );

          if (stderr) {
            console.error(
              'Python error:',
              stderr
            );
          }

          reject(
            new Error(
              'Unable to run the trained ML prediction model.'
            )
          );

          return;
        }


        try {

          const output = stdout.trim();

          if (!output) {

            reject(
              new Error(
                'The Python ML model returned an empty response.'
              )
            );

            return;
          }


          const result = JSON.parse(output);


          if (result.error) {

            reject(
              new Error(result.error)
            );

            return;
          }


          resolve(result);

        } catch (parseError) {

          console.error(
            'Invalid JSON returned by Python ML model.'
          );

          console.error(
            'Python output:',
            stdout
          );

          reject(
            new Error(
              'Invalid response received from the trained ML model.'
            )
          );
        }

      }
    );

  });

}


// ============================================================
// NORMALIZE PYTHON RESPONSE FOR FRONTEND
// ============================================================

function formatPredictionForFrontend(prediction) {

  const rf =
    prediction.regressionModels?.randomForest || {};

  const xgb =
    prediction.regressionModels?.xgBoost || {};

  const arima =
    prediction.forecast?.ARIMA || {};

  const lstm =
    prediction.forecast?.LSTM || {};


  /*
   * The React frontend expects:
   *
   * forecastingModels.lstm.forecast1Yr
   *
   * while Python returns:
   *
   * forecast.LSTM.1Year
   *
   * Therefore we convert the trained-model response
   * into the structure expected by the frontend.
   */


  const formatted = {

    // --------------------------------------------------------
    // MAIN VALUATION
    // --------------------------------------------------------

    success: true,

    currentValuation:
      prediction.currentValuation ?? null,

    predictedPrice:
      prediction.currentValuation ?? null,

    randomForestPrice:
      prediction.randomForestPrice ?? null,

    xgBoostPrice:
      prediction.xgBoostPrice ?? null,

    selectedModel:
      prediction.selectedModel ?? null,

    selectedModelDescription:
      prediction.selectedModelDescription ?? null,

    accuracyR2:
      prediction.accuracyR2 ?? null,

    mae:
      prediction.mae ?? null,

    rmse:
      prediction.rmse ?? null,


    // --------------------------------------------------------
    // REGRESSION MODELS
    // --------------------------------------------------------

    regressionModels: {

      randomForest: {

        name:
          rf.name ||
          'Random Forest Regressor',

        description:
          rf.description ||
          'Trained Random Forest Regressor',

        price:
          rf.price ?? prediction.randomForestPrice ?? null,

        mae:
          rf.mae ?? null,

        rmse:
          rf.rmse ?? null,

        r2:
          rf.r2 ?? null
      },


      xgBoost: {

        name:
          xgb.name ||
          'XGBoost Regressor',

        description:
          xgb.description ||
          'Trained XGBoost Regressor',

        price:
          xgb.price ?? prediction.xgBoostPrice ?? null,

        mae:
          xgb.mae ?? null,

        rmse:
          xgb.rmse ?? null,

        r2:
          xgb.r2 ?? null
      }

    },


    // --------------------------------------------------------
    // FORECASTING MODELS
    // --------------------------------------------------------

    forecastingModels: {

      arima: {

        name:
          arima.name ||
          'ARIMA Model',

        forecast1Yr:
          arima['1Year'] ?? null,

        forecast3Yr:
          arima['3Year'] ?? null,

        forecast5Yr:
          arima['5Year'] ?? null,

        mape:
          arima.MAPE ?? null,

        r2:
          arima.R2 ?? null,

        growth5YrPct:
          arima.growth5YrPct ?? null
      },


      lstm: {

        name:
          lstm.name ||
          'LSTM Neural Network',

        forecast1Yr:
          lstm['1Year'] ?? null,

        forecast3Yr:
          lstm['3Year'] ?? null,

        forecast5Yr:
          lstm['5Year'] ?? null,

        mape:
          lstm.MAPE ?? null,

        r2:
          lstm.R2 ?? null,

        growth5YrPct:
          lstm.growth5YrPct ?? null
      },


      selectedForecaster:
        prediction.forecast?.selectedForecaster ??
        'LSTM Neural Network',


      growthRate1Yr:
        prediction.forecast?.growthRate1Yr ??
        null,

      growthRate3Yr:
        prediction.forecast?.growthRate3Yr ??
        null,

      growthRate5Yr:
        prediction.forecast?.growthRate5Yr ??
        null

    },


    // --------------------------------------------------------
    // KEEP ORIGINAL PYTHON FORECAST RESPONSE TOO
    // --------------------------------------------------------

    forecast:
      prediction.forecast ?? null,


    // --------------------------------------------------------
    // INVESTMENT METRICS
    // --------------------------------------------------------

    investmentMetrics:
      prediction.investmentMetrics ?? {

        available: false,

        message:
          'Investment metrics are not produced by the trained price and forecasting models.'

      }

  };


  return formatted;
}


// ============================================================
// PROPERTY PRICE PREDICTION
// ============================================================

export const predictPropertyPrice = async (req, res) => {

  try {

    const propertyData = req.body || {};


    console.log(
      'Running trained ML prediction for property...'
    );


    const prediction =
      await runPythonPrediction(
        propertyData
      );


    const formattedPrediction =
      formatPredictionForFrontend(
        prediction
      );


    res.json(
      formattedPrediction
    );

  } catch (error) {

    console.error(
      'Property prediction failed:',
      error.message
    );


    res.status(500).json({

      success: false,

      error:
        error.message ||
        'Unable to generate property valuation.'

    });

  }

};


// ============================================================
// MODEL EVALUATION METRICS
// ============================================================

export const getModelEvaluationMetrics = (req, res) => {

  res.json({

    success: true,


    currentValuationModels: {

      randomForest: {

        name:
          'Random Forest Regressor',

        purpose:
          'Current property price prediction',

        status:
          'Trained and available',

        r2Score:
          0.8932,

        mae:
          '₹14.45 Lakhs',

        rmse:
          '₹18.86 Lakhs',

        trainingRecords:
          864,

        testingRecords:
          216,

        totalRecords:
          1080,

        featureCount:
          11

      },


      xgBoost: {

        name:
          'XGBoost Regressor',

        purpose:
          'Current property price prediction',

        status:
          'Trained and available',

        r2Score:
          0.8812,

        mae:
          '₹14.85 Lakhs',

        rmse:
          '₹19.89 Lakhs'

      }

    },


    timeSeriesForecastingModels: {

      arima: {

        name:
          'ARIMA Model',

        purpose:
          'Future property price forecasting',

        status:
          'Trained and available',

        mape:
          '4.12%',

        r2Score:
          0.921,

        forecastHorizon:
          '5 Years'

      },


      lstm: {

        name:
          'LSTM Neural Network',

        purpose:
          'Future property price forecasting',

        status:
          'Trained and available',

        mape:
          '2.85%',

        r2Score:
          0.968,

        forecastHorizon:
          '5 Years'

      }

    },


    modelSummary: {

      currentPriceModel:
        'Random Forest Regressor',

      futureForecastModel:
        'LSTM Neural Network',

      dataset:
        'Dataset.csv',

      totalRecords:
        1080,

      trainingRecords:
        864,

      testingRecords:
        216,

      randomForestR2:
        0.8932,

      xgBoostR2:
        0.8812,

      arimaMAPE:
        '4.12%',

      lstmMAPE:
        '2.85%'

    },


    explanation: {

      randomForest:
        'Random Forest combines multiple decision trees and averages their predictions to estimate property price.',

      xgBoost:
        'XGBoost uses gradient-boosted decision trees to estimate property price.',

      arima:
        'ARIMA uses historical time-series patterns to forecast future property prices.',

      lstm:
        'LSTM uses recurrent neural networks to learn long-term patterns in historical price sequences.'

    }

  });

};


// ============================================================
// HISTORICAL MARKET TRENDS
// ============================================================

export const getHistoricalTrends = (req, res) => {

  try {

    const historicalData =
      db.getHistoricalData();


    res.json(
      historicalData
    );

  } catch (error) {

    res.status(500).json({

      error:
        error.message

    });

  }

};