import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import PropertyMarketGrowthChart from '../components/PropertyMarketGrowthChart';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  ArrowLeft,
  Gavel,
  FileText,
  Sparkles
} from 'lucide-react';

export default function PropertyValuation({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [selectedPropId, setSelectedPropId] = useState(id || '');
  const [property, setProperty] = useState(null);
  const [valuation, setValuation] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD PROPERTIES
  // ============================================================

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await apiService.getProperties();

        if (res && res.properties) {
          setProperties(res.properties);

          if (!selectedPropId && res.properties.length > 0) {
            setSelectedPropId(res.properties[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching property list:', err);
      }
    }

    loadProperties();
  }, []);

  // ============================================================
  // UPDATE PROPERTY WHEN URL CHANGES
  // ============================================================

  useEffect(() => {
    if (id) {
      setSelectedPropId(id);
    }
  }, [id]);

  // ============================================================
  // LOAD PROPERTY + TRAINED ML PREDICTION
  // ============================================================

  useEffect(() => {
    async function fetchValuationData() {
      if (!selectedPropId) return;

      setLoading(true);

      try {
        let propData = properties.find(
          p => String(p.id) === String(selectedPropId)
        );

        if (!propData) {
          propData = await apiService.getPropertyById(selectedPropId);
        }

        setProperty(propData);

        console.log('Sending property to trained ML model:', propData);

        /*
         * IMPORTANT:
         *
         * apiService.predictValuation()
         * should call:
         *
         * POST /api/ml/predict
         *
         * The backend then runs:
         *
         * Python prediction_api.py
         *
         * which loads:
         *
         * Random Forest
         * XGBoost
         * ARIMA
         * LSTM
         */

        const valData = await apiService.predictValuation(propData);

        console.log('TRAINED ML MODEL RESPONSE:', valData);

        setValuation(valData);

        // Gemini insights are optional.
        try {
          const userRole = user ? user.role : 'Buyer';

          const geminiRes = await apiService.getGeminiInsights(
            propData,
            valData,
            userRole
          );

          setInsights(geminiRes);
        } catch (geminiError) {
          console.warn(
            'Gemini insights unavailable:',
            geminiError
          );

          setInsights(null);
        }

      } catch (err) {
        console.error(
          'Error loading valuation data:',
          err
        );
      } finally {
        setLoading(false);
      }
    }

    fetchValuationData();

  }, [selectedPropId, properties, user]);


  // ============================================================
  // REAL TRAINED MODEL VALUES
  // ============================================================

  const estimatedPrice =
    Number(
      valuation?.currentValuation
    ) ||
    Number(
      valuation?.predictedPrice
    ) ||
    Number(
      property?.price
    ) ||
    0;


  const minRange = Math.round(
    estimatedPrice * 0.96
  );

  const maxRange = Math.round(
    estimatedPrice * 1.04
  );


  // ============================================================
  // ACTUAL MODEL ACCURACY
  // ============================================================

  const accuracyR2 =
    Number(
      valuation?.accuracyR2
    ) || 0;

  const confidence =
    accuracyR2 > 0
      ? (accuracyR2 * 100).toFixed(1)
      : 'N/A';


  // ============================================================
  // LSTM FORECAST
  // ============================================================

  const lstmForecast =
    valuation?.forecast?.LSTM || null;

  const arimaForecast =
    valuation?.forecast?.ARIMA || null;


  const forecast1Yr =
    lstmForecast?.['1Year'];

  const forecast3Yr =
    lstmForecast?.['3Year'];

  const forecast5Yr =
    lstmForecast?.['5Year'];


  const growth1Yr =
    valuation?.forecast?.growthRate1Yr;

  const growth3Yr =
    valuation?.forecast?.growthRate3Yr;

  const growth5Yr =
    valuation?.forecast?.growthRate5Yr;


  // ============================================================
  // MODEL INFORMATION
  // ============================================================

  const selectedModel =
    valuation?.selectedModel ||
    'Trained ML Model';


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <button
          onClick={() =>
            property
              ? navigate(`/property/${property.id}`)
              : navigate(-1)
          }
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          Back to Property Details
        </button>


        {properties.length > 0 && (

          <div className="flex items-center gap-2 text-xs">

            <span className="font-bold text-slate-600">
              Select Property:
            </span>

            <select
              value={selectedPropId}
              onChange={(e) => {

                setSelectedPropId(
                  e.target.value
                );

                navigate(
                  `/property/${e.target.value}/valuation`
                );

              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >

              {properties.map(p => (

                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name} ({p.city} - ₹{p.price} L)
                </option>

              ))}

            </select>

          </div>

        )}

      </div>


      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (

        <div className="py-24 text-center space-y-4">

          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <p className="text-sm font-bold text-slate-700">
            Running Trained ML Models...
          </p>

          <p className="text-xs text-slate-400">
            Random Forest, XGBoost, ARIMA and LSTM are being evaluated.
          </p>

        </div>

      ) : !property ? (

        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">

          <p className="text-sm font-bold text-slate-600">
            No property selected or found for valuation.
          </p>

          <button
            onClick={() => navigate('/properties')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Browse Properties
          </button>

        </div>

      ) : (

        <div className="space-y-8 animate-in fade-in duration-300">


          {/* ==================================================
              PROPERTY HEADER
          ================================================== */}

          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            <div className="space-y-2">

              <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold text-blue-300 border border-blue-400/20">

                <FileText className="w-3.5 h-3.5 text-blue-400" />

                ML Real Estate Valuation Report

              </div>


              <h1 className="font-heading text-3xl font-extrabold tracking-tight">

                {property.name}

              </h1>


              <p className="text-slate-300 text-xs sm:text-sm flex items-center gap-2">

                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />

                {property.locality
                  ? `${property.locality}, ${property.city}`
                  : property.city
                }

                {' • '}

                Listed Price:

                <strong className="text-white">
                  ₹{property.price} Lakhs
                </strong>

              </p>

            </div>


            <div className="flex flex-wrap gap-3 shrink-0">

              {property.auctionEnabled && (

                <button
                  onClick={() =>
                    navigate(
                      `/auction/${property.id}/join`
                    )
                  }
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >

                  <Gavel className="w-4 h-4" />

                  Start Bidding

                </button>

              )}


              <button
                onClick={() =>
                  navigate(
                    `/property/${property.id}`
                  )
                }
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
              >

                <Building2 className="w-4 h-4" />

                View Property Info

              </button>

            </div>

          </div>


          {/* ==================================================
              SECTION 1 - CURRENT MARKET VALUE
          ================================================== */}

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">

            <div className="border-b border-slate-100 pb-4">

              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">

                Current Market Value

              </span>


              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">

                Estimated Property Price & Valuation Comparison

              </h2>


              <p className="text-xs text-slate-500 mt-0.5">

                Prediction generated using the trained machine learning models.

              </p>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


              {/* ESTIMATED VALUE */}

              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/80 rounded-2xl border border-blue-200 text-center space-y-2">

                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">

                  Estimated Market Value

                </span>


                <strong className="font-heading text-3xl sm:text-4xl font-black text-blue-900 block">

                  ₹{estimatedPrice.toFixed(2)} Lakhs

                </strong>


                <p className="text-[11px] text-blue-700 font-semibold">

                  {selectedModel}

                </p>

              </div>


              {/* RANGE */}

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">

                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">

                  Valuation Range

                </span>


                <strong className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-800 block">

                  ₹{minRange} L – ₹{maxRange} L

                </strong>


                <p className="text-[11px] text-slate-500">

                  Expected Fair Price Band

                </p>

              </div>


              {/* REAL R2 */}

              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">

                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">

                  Model R² Accuracy

                </span>


                <strong className="font-heading text-3xl sm:text-4xl font-black text-emerald-700 block">

                  {confidence === 'N/A'
                    ? 'N/A'
                    : `${confidence}%`
                  }

                </strong>


                <p className="text-[11px] text-emerald-800 font-semibold">

                  Trained Model Performance

                </p>

              </div>

            </div>


            {/* MODEL COMPARISON */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">


              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">

                <h3 className="text-sm font-bold text-slate-900 mb-3">

                  Random Forest Regressor

                </h3>


                <div className="grid grid-cols-3 gap-3 text-center">

                  <div>

                    <p className="text-[10px] text-slate-500">
                      Price
                    </p>

                    <p className="font-bold text-slate-800">
                      ₹{valuation?.regressionModels?.randomForest?.price ?? 'N/A'} L
                    </p>

                  </div>


                  <div>

                    <p className="text-[10px] text-slate-500">
                      R²
                    </p>

                    <p className="font-bold text-blue-700">
                      {valuation?.regressionModels?.randomForest?.r2 ?? 'N/A'}
                    </p>

                  </div>


                  <div>

                    <p className="text-[10px] text-slate-500">
                      MAE
                    </p>

                    <p className="font-bold text-slate-800">
                      {valuation?.regressionModels?.randomForest?.mae ?? 'N/A'} L
                    </p>

                  </div>

                </div>

              </div>


              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200">

                <h3 className="text-sm font-bold text-blue-900 mb-3">

                  XGBoost Regressor

                </h3>


                <div className="grid grid-cols-3 gap-3 text-center">

                  <div>

                    <p className="text-[10px] text-blue-600">
                      Price
                    </p>

                    <p className="font-bold text-blue-900">
                      ₹{valuation?.regressionModels?.xgBoost?.price ?? 'N/A'} L
                    </p>

                  </div>


                  <div>

                    <p className="text-[10px] text-blue-600">
                      R²
                    </p>

                    <p className="font-bold text-blue-700">
                      {valuation?.regressionModels?.xgBoost?.r2 ?? 'N/A'}
                    </p>

                  </div>


                  <div>

                    <p className="text-[10px] text-blue-600">
                      MAE
                    </p>

                    <p className="font-bold text-blue-900">
                      {valuation?.regressionModels?.xgBoost?.mae ?? 'N/A'} L
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              SECTION 2 - FORECAST
          ================================================== */}

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">

            <div className="border-b border-slate-100 pb-4">

              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">

                Future Property Price Forecast

              </span>


              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">

                Multi-Year Capital Appreciation Horizon

              </h2>


              <p className="text-xs text-slate-500 mt-0.5">

                Forecast generated from the trained LSTM forecasting model.

              </p>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">


              {/* 1 YEAR */}

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">

                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">

                  1-Year Forecast

                </span>


                <strong className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 block">

                  ₹{forecast1Yr ?? 'N/A'} Lakhs

                </strong>


                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">

                  +{growth1Yr ?? 'N/A'} Projected Growth

                </span>

              </div>


              {/* 3 YEAR */}

              <div className="p-6 bg-purple-50/70 rounded-2xl border border-purple-200 text-center space-y-2">

                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">

                  3-Year Forecast

                </span>


                <strong className="font-heading text-2xl sm:text-3xl font-extrabold text-purple-900 block">

                  ₹{forecast3Yr ?? 'N/A'} Lakhs

                </strong>


                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full inline-block">

                  +{growth3Yr ?? 'N/A'} Projected Growth

                </span>

              </div>


              {/* 5 YEAR */}

              <div className="p-6 bg-blue-50/70 rounded-2xl border border-blue-200 text-center space-y-2">

                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">

                  5-Year Forecast

                </span>


                <strong className="font-heading text-2xl sm:text-3xl font-extrabold text-blue-900 block">

                  ₹{forecast5Yr ?? 'N/A'} Lakhs

                </strong>


                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full inline-block">

                  +{growth5Yr ?? 'N/A'} Projected Growth

                </span>

              </div>

            </div>


            {/* ==================================================
                INTERACTIVE YEAR-BY-YEAR MARKET GROWTH GRAPH
            ================================================== */}

            <PropertyMarketGrowthChart valuation={valuation} property={property} />


            {/* FORECAST MODEL */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">

                <h3 className="text-sm font-bold text-slate-900">
                  ARIMA Model
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  MAPE: {arimaForecast?.MAPE ?? 'N/A'}
                </p>

                <p className="text-xs text-slate-500">
                  R²: {arimaForecast?.R2 ?? 'N/A'}
                </p>

              </div>


              <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200">

                <h3 className="text-sm font-bold text-purple-900">
                  LSTM Neural Network
                </h3>

                <p className="text-xs text-purple-700 mt-1">
                  MAPE: {lstmForecast?.MAPE ?? 'N/A'}
                </p>

                <p className="text-xs text-purple-700">
                  R²: {lstmForecast?.R2 ?? 'N/A'}
                </p>

                <p className="text-xs font-bold text-purple-900 mt-2">
                  Selected Forecaster
                </p>

              </div>

            </div>

          </div>


          {/* ==================================================
              SECTION 3 - INVESTMENT ANALYSIS
          ================================================== */}

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">

            <div className="border-b border-slate-100 pb-4">

              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">

                Investment Analysis

              </span>


              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">

                Financial Metrics & Return Indicators

              </h2>

            </div>


            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">

              <p className="text-sm font-bold text-slate-700">

                Investment metrics are not produced by the trained ML models.

              </p>


              <p className="text-xs text-slate-500 mt-2">

                The current ML pipeline provides trained property price
                prediction and future price forecasting only.

              </p>

            </div>

          </div>


          {/* ==================================================
              SECTION 4 - RECOMMENDATION
          ================================================== */}

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">

            <div className="border-b border-slate-100 pb-4">

              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">

                Investment Recommendation

              </span>


              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">

                Executive Property Summary & Guidance

              </h2>

            </div>


            <div
              className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                (insights?.recommendation || 'BUY') === 'BUY'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : insights?.recommendation === 'HOLD'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-rose-600 text-white border-rose-700'
              }`}
            >

              <div className="space-y-1">

                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 block">

                  Property Guidance Status

                </span>


                <strong className="font-heading text-2xl font-black block">

                  {insights?.recommendation || 'BUY'} RECOMMENDATION

                </strong>


                <p className="text-xs opacity-90 leading-relaxed max-w-2xl">

                  {insights?.recommendationReason ||
                    `The trained ${selectedModel} model estimates the property at ₹${estimatedPrice.toFixed(2)} Lakhs.`}

                </p>

              </div>


              <div className="px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl text-lg font-black border border-white/30 shrink-0">

                {insights?.recommendation || 'BUY'}

              </div>

            </div>


            {/* RATIONALE */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">

                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">

                  <Sparkles className="w-4 h-4 text-blue-600" />

                  Valuation Rationale

                </h3>


                <p className="text-xs text-slate-600 leading-relaxed">

                  {insights?.priceRationale ||
                    `The trained ${selectedModel} model generated a current valuation of ₹${estimatedPrice.toFixed(2)} Lakhs based on the property's supplied features.`}

                </p>

              </div>


              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">

                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">

                  <TrendingUp className="w-4 h-4 text-blue-600" />

                  Market Trend Analysis

                </h3>


                <p className="text-xs text-slate-600 leading-relaxed">

                  {insights?.marketTrendAnalysis ||
                    `The LSTM forecasting model projects ₹${forecast5Yr ?? 'N/A'} Lakhs after five years.`}

                </p>

              </div>

            </div>


            {/* ADVANTAGES / RISKS */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">

                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">

                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />

                  Key Investment Advantages

                </h3>


                <ul className="space-y-1.5">

                  {(insights?.advantages || [
                    'ML-based property valuation',
                    'Random Forest and XGBoost model comparison',
                    'ARIMA and LSTM future price forecasting'
                  ]).map((adv, idx) => (

                    <li
                      key={idx}
                      className="text-xs text-slate-700 flex items-start gap-2"
                    >

                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />

                      {adv}

                    </li>

                  ))}

                </ul>

              </div>


              <div className="p-5 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-2">

                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">

                  <AlertTriangle className="w-4 h-4 text-rose-600" />

                  Risk Factors to Consider

                </h3>


                <ul className="space-y-1.5">

                  {(insights?.risks || [
                    'ML predictions depend on the quality of input property data',
                    'Future forecasts are estimates and not guaranteed market prices'
                  ]).map((risk, idx) => (

                    <li
                      key={idx}
                      className="text-xs text-slate-700 flex items-start gap-2"
                    >

                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />

                      {risk}

                    </li>

                  ))}

                </ul>

              </div>

            </div>


            {/* ==================================================
                BOTTOM BUTTONS
            ================================================== */}

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">

              <button
                onClick={() =>
                  navigate(
                    `/property/${property.id}`
                  )
                }
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >

                ← Back to Property Details

              </button>


              <div className="flex gap-3">

                {property.auctionEnabled && (

                  <button
                    onClick={() =>
                      navigate(
                        `/auction/${property.id}/join`
                      )
                    }
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >

                    <Gavel className="w-4 h-4" />

                    Start Bidding

                  </button>

                )}


                <button
                  onClick={() =>
                    navigate('/properties')
                  }
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >

                  Browse More Properties

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}