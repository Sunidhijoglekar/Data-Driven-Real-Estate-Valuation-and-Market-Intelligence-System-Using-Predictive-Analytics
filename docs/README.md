# System Documentation

Welcome to the **Data-Driven Real Estate Valuation & Market Intelligence System** documentation.

## Project Structure Overview

```
├── frontend/             # React + Vite UI Application
│   ├── src/              # React Components, Pages, Services, Styles
│   ├── index.html        # Entry HTML
│   └── vite.config.js    # Vite Build & Alias Configuration
├── backend/              # Express.js REST API Server
│   ├── controllers/      # Route Handlers (Auth, Bids, Properties, ML, Gemini)
│   ├── routes/           # Express Routers
│   ├── middleware/       # File Uploads & Auth Middleware
│   ├── database/         # Data Access Layer & Schema Definitions
│   ├── utils/            # ML Calculation Utilities & Valuation Engine
│   └── server.js         # Backend Express App Initialization
├── ml/                   # Machine Learning Modules
│   ├── datasets/         # Real Estate Property CSV & JSON Datasets
│   ├── preprocessing/    # Data Cleaning & Feature Encoding Pipelines
│   ├── training/         # Model Trainers (RF, XGBoost, ARIMA, LSTM)
│   ├── prediction/       # Prediction Service API
│   ├── models/           # Model Artifacts & Evaluation Metadata
│   └── evaluation/       # Performance Metrics & Evaluation Helpers
├── docs/                 # System Architecture & API Documentation
├── server.js             # Root Server Bootstrapper
└── package.json          # Dependency Manifest & Execution Scripts
```

For technical details, see:
- [System Architecture](ARCHITECTURE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Machine Learning Models & Pipeline](ML_MODELS.md)
