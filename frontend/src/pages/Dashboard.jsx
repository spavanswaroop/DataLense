import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { healthApi, datasetApi, analysisApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import {
  Activity, Server, Cpu, CheckCircle2, AlertCircle, AlertTriangle, Database,
  RefreshCw, UploadCloud, Layers, ShieldCheck, FileText, Flame, Sparkles,
  HardDrive, ArrowRight, Play, Check, TrendingUp
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const QUALITY_TIER_COLORS = {
  high: '#10b981',     // Emerald
  moderate: '#f59e0b', // Amber
  critical: '#f43f5e'  // Rose
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Microservice health state
  const [backendStatus, setBackendStatus] = useState('checking');
  const [mlStatus, setMlStatus] = useState('checking');

  // Datasets and analysis state
  const [datasets, setDatasets] = useState([]);
  const [datasetAnalyses, setDatasetAnalyses] = useState({}); // datasetId -> latestAnalysis
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    // 1. Health check
    try {
      const bRes = await healthApi.checkBackendHealth();
      setBackendStatus(bRes.data?.status === 'UP' ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }

    try {
      const mRes = await healthApi.checkMlServiceViaBackend();
      setMlStatus(mRes.data?.ml_service_connection === 'CONNECTED' ? 'online' : 'offline');
    } catch {
      setMlStatus('offline');
    }

    // 2. Fetch datasets and their latest analyses
    try {
      const dsRes = await datasetApi.getDatasets();
      const dsList = dsRes.data || [];
      setDatasets(dsList);

      // Fetch latest analyses in parallel
      const analysesMap = {};
      await Promise.all(
        dsList.map(async (ds) => {
          try {
            const anRes = await analysisApi.getDatasetAnalyses(ds.id);
            if (anRes.data && anRes.data.length > 0) {
              analysesMap[ds.id] = anRes.data[0];
            }
          } catch {
            // Best effort
          }
        })
      );
      setDatasetAnalyses(analysesMap);
    } catch (err) {
      setError('Failed to fetch dataset repository data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleTriggerAnalysis = async (datasetId) => {
    setAnalyzingId(datasetId);
    try {
      const res = await analysisApi.triggerAnalysis(datasetId);
      navigate(`/analyses/${res.data.id}`);
    } catch (err) {
      alert('Analysis trigger failed: ' + (err.response?.data?.message || err.message));
      setAnalyzingId(null);
    }
  };

  const handleLoadDemoDataset = async () => {
    setDemoLoading(true);
    try {
      const res = await datasetApi.loadDemoDataset();
      // Auto-trigger analysis on demo dataset
      const analysisRes = await analysisApi.triggerAnalysis(res.data.id);
      navigate(`/analyses/${analysisRes.data.id}`);
    } catch (err) {
      alert('Failed to load demo dataset: ' + (err.response?.data?.message || err.message));
      setDemoLoading(false);
    }
  };

  // =========================================================================
  // Derived Metrics & Aggregations
  // =========================================================================
  const totalDatasets = datasets.length;
  const totalRows = datasets.reduce((sum, d) => sum + (Number(d.rowCount) || 0), 0);
  const totalStorageBytes = datasets.reduce((sum, d) => sum + (Number(d.fileSize) || 0), 0);
  const maxStorageLimitBytes = 100 * 1024 * 1024; // 100 MB ceiling
  const storagePercentage = Math.min((totalStorageBytes / maxStorageLimitBytes) * 100, 100);

  // Quality score aggregates across completed analyses
  const completedAnalyses = Object.values(datasetAnalyses).filter(
    (a) => a && a.status === 'COMPLETED' && a.summary
  );

  const avgQualityScore =
    completedAnalyses.length > 0
      ? Math.round(
          completedAnalyses.reduce((sum, a) => sum + (Number(a.summary.quality_score) || 0), 0) /
            completedAnalyses.length
        )
      : null;

  // Anomalies caught
  let totalMissingCells = 0;
  let totalDuplicateRows = 0;
  let totalOutlierFeaturesCount = 0;

  completedAnalyses.forEach((a) => {
    const s = a.summary || {};
    totalMissingCells += Number(s.missing_values || 0);
    totalDuplicateRows += Number(s.duplicate_rows || 0);
    if (Array.isArray(s.outlier_columns)) {
      totalOutlierFeaturesCount += s.outlier_columns.length;
    }
  });

  const totalAnomaliesCaught = totalMissingCells + totalDuplicateRows + totalOutlierFeaturesCount;

  // Quality score tier counts for Donut Chart
  let highQualityCount = 0;
  let moderateQualityCount = 0;
  let criticalQualityCount = 0;

  completedAnalyses.forEach((a) => {
    const score = Number(a.summary?.quality_score || 0);
    if (score >= 80) highQualityCount++;
    else if (score >= 60) moderateQualityCount++;
    else criticalQualityCount++;
  });

  const qualityChartData = [
    { name: 'High Quality (≥80)', value: highQualityCount, color: QUALITY_TIER_COLORS.high },
    { name: 'Moderate Quality (60-79)', value: moderateQualityCount, color: QUALITY_TIER_COLORS.moderate },
    { name: 'Critical Issues (<60)', value: criticalQualityCount, color: QUALITY_TIER_COLORS.critical },
  ].filter((d) => d.value > 0);

  // Cross-dataset Alerts Watchlist
  const watchlistAlerts = [];
  completedAnalyses.forEach((a) => {
    const s = a.summary || {};
    const strongCorr = s.correlation?.strong_correlations || [];
    const outlierCols = s.outlier_columns || [];
    const missing = Number(s.missing_values || 0);
    const score = Number(s.quality_score || 0);

    if (score < 60) {
      watchlistAlerts.push({
        severity: 'HIGH',
        datasetName: a.datasetName,
        datasetId: a.datasetId,
        analysisId: a.id,
        title: 'Critical Health Score',
        desc: `Overall quality rating fell to ${score}/100. Severe data hygiene issues detected.`
      });
    }

    if (strongCorr.length > 0) {
      watchlistAlerts.push({
        severity: 'HIGH',
        datasetName: a.datasetName,
        datasetId: a.datasetId,
        analysisId: a.id,
        title: 'Severe Multicollinearity',
        desc: `${strongCorr.length} feature pair(s) exhibit strong collinearity (|r| ≥ 0.70).`
      });
    }

    if (outlierCols.length > 0) {
      watchlistAlerts.push({
        severity: 'MEDIUM',
        datasetName: a.datasetName,
        datasetId: a.datasetId,
        analysisId: a.id,
        title: 'Statistical Outliers Detected',
        desc: `Values exceed 1.5×IQR boundary in ${outlierCols.length} column(s): [${outlierCols.slice(0, 3).join(', ')}${outlierCols.length > 3 ? '...' : ''}].`
      });
    }

    if (missing > 0) {
      watchlistAlerts.push({
        severity: 'MEDIUM',
        datasetName: a.datasetName,
        datasetId: a.datasetId,
        analysisId: a.id,
        title: 'Missing Observations',
        desc: `${missing.toLocaleString()} null cells require imputation before training.`
      });
    }
  });

  const allSystemsOnline = backendStatus === 'online' && mlStatus === 'online';

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. HEADER: Welcome Back • System Status Pill • Action Buttons             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/60">
              Data Quality Observatory
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Multi-Service Local Node</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Welcome back, {user?.username || 'Data Scientist'}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time dataset health profiling, anomaly interception, and statistical validation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Microservice Status Indicator Pill */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border shadow-sm ${
              allSystemsOnline
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
            }`}
            title={`Backend: ${backendStatus} • ML Engine: ${mlStatus}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                allSystemsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            <span>{allSystemsOnline ? 'All Systems Operational' : 'Microservice Degraded'}</span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Dataset
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE PORTFOLIO KPI STRIP                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Datasets Count */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Datasets Monitored
            </span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-white font-mono">{totalDatasets}</p>
            <p className="text-[11px] text-slate-500 mt-1">Active files in workspace</p>
          </div>
        </div>

        {/* KPI 2: Rows Profiled */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rows Profiled
            </span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-blue-400 font-mono">
              {totalRows.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Total verified observations</p>
          </div>
        </div>

        {/* KPI 3: Avg Quality Score */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg Quality Score
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-purple-400 font-mono">
              {avgQualityScore !== null ? `${avgQualityScore}/100` : 'N/A'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Across all profiled datasets</p>
          </div>
        </div>

        {/* KPI 4: Anomalies Intercepted */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Anomalies Intercepted
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-amber-400 font-mono">
              {totalAnomaliesCaught.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Nulls, outliers & duplicates caught</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GLOBAL ANOMALY & QUALITY ALERTS WATCHLIST                              */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Quality Watchlist & Defect Feed</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {watchlistAlerts.length} Active Flag(s)
          </span>
        </div>

        {watchlistAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 max-h-[220px] overflow-y-auto pr-1">
            {watchlistAlerts.slice(0, 6).map((alert, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[160px]" title={alert.datasetName}>
                      {alert.datasetName}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        alert.severity === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1.5">{alert.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{alert.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60 text-right">
                  <Link
                    to={`/analyses/${alert.analysisId}`}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition inline-flex items-center gap-1"
                  >
                    Investigate <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">All Monitored Datasets Clean</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No high-severity multicollinearity or critical null rates detected across your workspace.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUAL ANALYTICS GRID: Quality Distribution & Storage Quota Meter      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quality Score Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Dataset Quality Distribution
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {completedAnalyses.length} Profiled
            </span>
          </div>

          {qualityChartData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
              <div className="h-[180px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {qualityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with Counts */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    High Quality (≥80)
                  </span>
                  <span className="font-mono font-bold text-white">{highQualityCount}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Moderate (60-79)
                  </span>
                  <span className="font-mono font-bold text-white">{moderateQualityCount}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    Critical (&lt;60)
                  </span>
                  <span className="font-mono font-bold text-white">{criticalQualityCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
              No datasets profiled yet. Upload and analyze datasets to populate the quality distribution curve.
            </div>
          )}

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Graded based on completeness, uniqueness, validity, and outlier resilience.
          </p>
        </div>

        {/* Right: Storage Footprint & Quota Meter */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              Storage Footprint & Ingestion Quota
            </h3>
            <span className="text-xs font-mono text-slate-400">100 MB Capacity</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">
                {formatBytes(totalStorageBytes)}
              </span>
              <span className="text-xs text-slate-400">
                {storagePercentage.toFixed(1)}% of 100 MB Used
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  storagePercentage > 85 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400">Average File Size</span>
              <p className="font-mono font-bold text-white mt-1">
                {totalDatasets > 0 ? formatBytes(totalStorageBytes / totalDatasets) : '0 B'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400">Remaining Quota</span>
              <p className="font-mono font-bold text-emerald-400 mt-1">
                {formatBytes(Math.max(maxStorageLimitBytes - totalStorageBytes, 0))}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Local zero-copy streaming architecture ensures zero memory overflow for files up to 100MB.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RECENT DATASETS TABLE                                                  */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Recent Monitored Datasets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Quick access to the latest analyzed data files</p>
          </div>
          <Link
            to="/datasets"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
          >
            View All ({datasets.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {datasets.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Database className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No Datasets Uploaded</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Get started by uploading a CSV file or test out the pre-bundled demo dataset below.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition mt-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload First Dataset
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6">Dataset</th>
                  <th className="py-3 px-6">Size</th>
                  <th className="py-3 px-6">Rows</th>
                  <th className="py-3 px-6">Q-Score</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {datasets.slice(0, 5).map((ds) => {
                  const analysis = datasetAnalyses[ds.id];
                  const qScore = analysis?.summary?.quality_score;

                  return (
                    <tr key={ds.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-white">{ds.name}</div>
                        <div className="text-[11px] text-slate-500">{ds.originalFilename}</div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-300">
                        {ds.formattedFileSize}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-300">
                        {ds.rowCount?.toLocaleString() || '-'}
                      </td>
                      <td className="py-3.5 px-6">
                        {qScore !== undefined && qScore !== null ? (
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                              qScore >= 80
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                : qScore >= 60
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            }`}
                          >
                            {Math.round(qScore)} / 100
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Unanalyzed</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {ds.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {analysis ? (
                          <Link
                            to={`/analyses/${analysis.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            View Report
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleTriggerAnalysis(ds.id)}
                            disabled={analyzingId === ds.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                          >
                            {analyzingId === ds.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            Analyze
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. 1-CLICK DEMO PLAYGROUND                                                */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-white">1-Click Interactive Demo Playground</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Want to see the quality engine in action immediately? Launch a pre-bundled real-world Kaggle dataset with rich anomalies.
            </p>
          </div>

          <button
            onClick={handleLoadDemoDataset}
            disabled={demoLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shrink-0 disabled:opacity-50 hover:shadow-purple-500/20"
          >
            {demoLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Ingesting & Profiling...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Launch Demo Dataset
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-white">🧪 Unstable Customer Credit</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Real financial credit scoring observations</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-white">⚠️ Injected Quality Anomalies</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Missing cells, statistical outliers, skewness</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-semibold text-white">⚡ Instant Automated Report</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated $Q$-score, correlations & histograms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
