# DataLens – Intelligent Dataset Analyzer

DataLens is a web-based Intelligent Dataset Analyzer designed to evaluate dataset quality before feeding data into Machine Learning models. It automates dataset profiling, identifies data health anomalies (missing values, duplicates, outliers via IQR), computes a composite Data-Quality Score, and supports end-to-end ML model training and evaluation.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Axios, React Router (Port `5173`)
- **Backend**: Java 17, Spring Boot 3, Spring Security, JWT, Spring Data JPA, Flyway (Port `8080`)
- **ML Microservice**: Python 3, FastAPI, Pandas, NumPy, Scikit-learn (Port `8000`)
- **Database**: PostgreSQL (Port `5432`)

---

## 📁 Repository Structure

```
datalens/
├── frontend/        # React + Vite user interface
├── backend/         # Spring Boot REST API & business orchestration
├── ml-service/      # Python FastAPI microservice for data analysis & ML
├── storage/         # Local isolated directories for uploads, processed datasets & models
│   ├── uploads/
│   ├── processed/
│   └── models/
└── docs/            # Architecture specifications & API references
```

---

## 🚀 Getting Started

Instructions for running all three services locally are documented in the respective directories and `docs/`.
