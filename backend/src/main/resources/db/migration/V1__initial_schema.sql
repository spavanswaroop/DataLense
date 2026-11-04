-- DataLens Initial Schema V1
-- Creates the core 6 tables defined in the DataLens blueprint

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. DATASETS
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    row_count BIGINT,
    column_count INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);

-- 3. ANALYSIS_RUNS
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    summary JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_dataset_id ON analysis_runs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_status ON analysis_runs(status);

-- 4. COLUMN_PROFILES
CREATE TABLE IF NOT EXISTS column_profiles (
    id BIGSERIAL PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    missing_count BIGINT DEFAULT 0,
    missing_percentage DOUBLE PRECISION DEFAULT 0.0,
    unique_count BIGINT,
    statistics JSONB
);

CREATE INDEX IF NOT EXISTS idx_column_profiles_analysis_id ON column_profiles(analysis_id);

-- 5. MODEL_RUNS
CREATE TABLE IF NOT EXISTS model_runs (
    id UUID PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    target_column VARCHAR(255) NOT NULL,
    task_type VARCHAR(30) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    model_path TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_runs_dataset_id ON model_runs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_model_runs_status ON model_runs(status);

-- 6. MODEL_METRICS
CREATE TABLE IF NOT EXISTS model_metrics (
    id BIGSERIAL PRIMARY KEY,
    model_run_id UUID NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_metrics_run_id ON model_metrics(model_run_id);

