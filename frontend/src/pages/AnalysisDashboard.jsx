import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisApi } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import {
  Layers, Database, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  ArrowLeft, RefreshCw, BarChart2, ShieldCheck, HelpCircle, FileText,
  Network, Flame
} from 'lucide-react';

export default function AnalysisDashboard() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedColumnName, setSelectedColumnName] = useState('');
  const [hoveredCell, setHoveredCell] = useState(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await analysisApi.getAnalysisById(id);
      setAnalysis(response.data);
      if (response.data.columnProfiles && response.data.columnProfiles.length > 0) {
        setSelectedColumnName(response.data.columnProfiles[0].columnName);
      }
    } catch (err) {
      setError('Failed to load analysis report: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">Loading comprehensive dataset analysis...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-8 rounded-2xl bg-red-950/30 border border-red-800/40 text-center space-y-4 max-w-xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Analysis Unavailable</h2>
        <p className="text-sm text-red-300">{error || 'Analysis record could not be found.'}</p>
        <Link
          to="/datasets"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Datasets
        </Link>
      </div>
    );
  }

  if (analysis.status === 'FAILED') {
    return (
      <div className="p-8 rounded-2xl bg-red-950/30 border border-red-800/40 text-center space-y-4 max-w-xl mx-auto">
        <XCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Analysis Failed</h2>
        <p className="text-sm text-red-300">{analysis.errorMessage || 'An error occurred during dataset analysis.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/datasets"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Datasets
          </Link>
          <button
            onClick={async () => {
              try {
                const res = await analysisApi.triggerAnalysis(analysis.datasetId);
                window.location.href = `/analyses/${res.data.id}`;
              } catch (err) {
                alert('Retry failed: ' + (err.response?.data?.message || err.message));
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const summary = analysis.summary || {};
  const qualityScore = Number(summary.quality_score || 0);
  const rows = Number(summary.rows || 0);
  const columns = Number(summary.columns || 0);
  const missingValues = Number(summary.missing_values || 0);
  const duplicateRows = Number(summary.duplicate_rows || 0);
  const outlierColumns = Array.isArray(summary.outlier_columns) ? summary.outlier_columns : [];
  const columnProfiles = analysis.columnProfiles || [];
  const correlation = summary.correlation || { columns: [], matrix: [], strong_correlations: [] };
  const corrColumns = correlation.columns || [];
  const corrMatrix = correlation.matrix || [];
  const strongCorrelations = correlation.strong_correlations || [];

  const getCorrelationColor = (val) => {
    if (val >= 0.99) return 'bg-emerald-500/80 text-white font-bold';
    if (val >= 0.7) return 'bg-emerald-600/70 text-emerald-100 font-bold';
    if (val >= 0.4) return 'bg-emerald-700/40 text-emerald-200 font-medium';
    if (val >= 0.1) return 'bg-emerald-950/40 text-emerald-300';
    if (val > -0.1) return 'bg-slate-900/60 text-slate-400';
    if (val > -0.4) return 'bg-rose-950/40 text-rose-300';
    if (val > -0.7) return 'bg-rose-700/40 text-rose-200 font-medium';
    return 'bg-rose-600/70 text-rose-100 font-bold';
  };

  const selectedProfile = columnProfiles.find(c => c.columnName === selectedColumnName) || columnProfiles[0];

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return {
        label: 'Excellent Quality',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/40 border-emerald-800/60',
        bar: 'bg-emerald-500'
      };
    } else if (score >= 60) {
      return {
        label: 'Moderate Quality (Action Advised)',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-800/60',
        bar: 'bg-amber-500'
      };
    } else {
      return {
        label: 'Low Quality (Requires Preprocessing)',
        color: 'text-rose-400',
        bg: 'bg-rose-950/40 border-rose-800/60',
        bar: 'bg-rose-500'
      };
    }
  };

  const scoreBadge = getScoreBadge(qualityScore);

  // Extract columns with missing values
  const missingColumns = columnProfiles.filter(c => c.missingCount > 0);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/datasets"
              className="text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Datasets
            </Link>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Analysis ID: {analysis.id.slice(0, 8)}...</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {analysis.datasetName}
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60">
              AI Profiled
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Completed on {analysis.completedAt ? new Date(analysis.completedAt).toLocaleString() : 'Recently'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalysis}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            Upload Another
          </Link>
        </div>
      </div>

      {/* KPI Cards & Quality Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quality Score Radial Card */}
        <div className={`p-6 rounded-2xl border backdrop-blur flex flex-col justify-between ${scoreBadge.bg}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Data-Quality Score
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${scoreBadge.color}`}>
                Q-Metric
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold tracking-tight ${scoreBadge.color}`}>
                {qualityScore}
              </span>
              <span className="text-lg text-slate-400 font-medium">/ 100</span>
            </div>
            <p className="text-xs font-medium text-slate-300 mt-2">{scoreBadge.label}</p>
          </div>

          <div className="mt-6">
            <div className="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${scoreBadge.bar}`}
                style={{ width: `${qualityScore}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Heuristic formula: 0.4C + 0.2D + 0.2V + 0.2S
            </p>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <span className="text-xs text-slate-400 font-medium">Total Rows</span>
            <p className="text-2xl font-bold text-white mt-2 font-mono">{rows.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">Sample instances</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <span className="text-xs text-slate-400 font-medium">Total Features</span>
            <p className="text-2xl font-bold text-white mt-2 font-mono">{columns}</p>
            <p className="text-[11px] text-slate-500 mt-1">Dataset columns</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <span className="text-xs text-slate-400 font-medium">Missing Cells</span>
            <p className={`text-2xl font-bold mt-2 font-mono ${missingValues > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {missingValues}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {rows * columns > 0 ? ((missingValues / (rows * columns)) * 100).toFixed(2) : 0}% of data
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <span className="text-xs text-slate-400 font-medium">Duplicate Rows</span>
            <p className={`text-2xl font-bold mt-2 font-mono ${duplicateRows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {duplicateRows}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {rows > 0 ? ((duplicateRows / rows) * 100).toFixed(1) : 0}% duplicates
            </p>
          </div>

          {/* Outlier summary bar */}
          <div className="col-span-2 sm:col-span-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">IQR Outlier Detection</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {outlierColumns.length > 0
                    ? `Anomalous values detected in ${outlierColumns.length} feature(s): ${outlierColumns.join(', ')}`
                    : 'No extreme outliers detected across numerical columns (Values strictly within 1.5×IQR boundaries).'}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
              IQR 1.5× Method
            </span>
          </div>
        </div>
      </div>

      {/* Preprocessing Recommendations & Missing Values Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Values Breakdown Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Missing Values Breakdown
            </h3>
            <span className="text-xs text-slate-400">
              {missingColumns.length} feature(s) affected
            </span>
          </div>

          {missingColumns.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-white mt-2">Zero Missing Values</p>
              <p className="text-xs text-slate-400 mt-1">This dataset is 100% complete.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[280px] overflow-y-auto pr-1">
              {missingColumns.map((col) => (
                <div key={col.columnName} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-white">{col.columnName}</span>
                    <span className="text-xs text-slate-400 ml-2">({col.dataType})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-amber-400 font-medium">
                      {col.missingCount} missing ({col.missingPercentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable Preprocessing Recommendations */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Preprocessing Recommendations
            </h3>
            <span className="text-xs text-purple-400 font-medium">Actionable Insights</span>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {duplicateRows > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Duplicate Records Warning</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Found {duplicateRows} exact duplicate rows. Deduplication recommended to avoid model overfit.
                  </p>
                </div>
              </div>
            )}

            {missingColumns.length > 0 ? (
              missingColumns.map((col) => (
                <div key={col.columnName} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Impute "{col.columnName}"</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {col.dataType === 'NUMERICAL'
                        ? 'Recommended: Median Imputation (robust against outliers).'
                        : 'Recommended: Mode Imputation (most frequent category).'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-white">No Imputation Needed</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    All features contain complete observations with no null values.
                  </p>
                </div>
              </div>
            )}

            {outlierColumns.length > 0 && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Outlier Treatment</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Columns [{outlierColumns.join(', ')}] contain values beyond 1.5×IQR. Consider RobustScaler or Winsorization.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Feature Distribution Visualizer (Recharts) */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              Feature Distribution Charts
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any column to view its histogram bins or categorical frequency breakdown
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400">Select Feature:</label>
            <select
              value={selectedColumnName}
              onChange={(e) => setSelectedColumnName(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {columnProfiles.map((cp) => (
                <option key={cp.columnName} value={cp.columnName}>
                  {cp.columnName} ({cp.dataType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Chart Area */}
            <div className="lg:col-span-2 h-[260px] w-full bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
              {selectedProfile.dataType === 'NUMERICAL' ? (
                selectedProfile.statistics?.histogram && selectedProfile.statistics.histogram.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedProfile.statistics.histogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No histogram data available
                  </div>
                )
              ) : (
                selectedProfile.statistics?.distribution && selectedProfile.statistics.distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedProfile.statistics.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No distribution data available
                  </div>
                )
              )}
            </div>

            {/* Feature Stats Summary Cards */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Data Type</span>
                <p className="text-base font-bold text-white mt-1">{selectedProfile.dataType}</p>
              </div>

              {selectedProfile.dataType === 'NUMERICAL' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Mean</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedProfile.statistics?.mean ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Median</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedProfile.statistics?.median ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Std Dev</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedProfile.statistics?.std ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Min - Max</span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {selectedProfile.statistics?.min ?? 'N/A'} to {selectedProfile.statistics?.max ?? 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Most Frequent Category (Mode)</span>
                  <p className="text-sm font-bold text-purple-400 mt-1">
                    {selectedProfile.statistics?.top_value ?? 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Unique Distinct Classes: {selectedProfile.uniqueCount}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Correlation Heatmap */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" />
              Feature Correlation Heatmap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pearson correlation matrix (r ∈ [-1, +1]) identifying linear dependencies and multicollinearity
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-rose-400 font-bold">-1.0 (Inverse)</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-rose-500 via-slate-700 to-emerald-500" />
            <span className="text-emerald-400 font-bold">+1.0 (Direct)</span>
          </div>
        </div>

        {corrColumns.length >= 2 && corrMatrix.length > 0 ? (
          <div className="space-y-6">
            {/* Interactive Grid Table */}
            <div className="overflow-x-auto pb-2">
              <div className="inline-block min-w-full align-middle">
                <table className="border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-semibold text-slate-400 border-b border-slate-800 w-32 sticky left-0 bg-slate-900/90 backdrop-blur z-10">
                        Feature
                      </th>
                      {corrColumns.map((col) => (
                        <th
                          key={col}
                          className="p-2 text-center font-semibold text-slate-300 border-b border-slate-800 min-w-[70px] max-w-[100px] truncate"
                          title={col}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {corrColumns.map((rowCol, i) => (
                      <tr key={rowCol} className="hover:bg-slate-800/30 transition">
                        <td className="p-2 font-semibold text-white border-b border-slate-800/60 sticky left-0 bg-slate-900/90 backdrop-blur z-10 truncate max-w-[140px]" title={rowCol}>
                          {rowCol}
                        </td>
                        {corrColumns.map((colName, j) => {
                          const val = corrMatrix[i] ? corrMatrix[i][j] : 0;
                          const isHovered = hoveredCell && hoveredCell.row === rowCol && hoveredCell.col === colName;
                          return (
                            <td
                              key={colName}
                              onMouseEnter={() => setHoveredCell({ row: rowCol, col: colName, val })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`p-2.5 text-center font-mono text-[11px] border border-slate-950/80 cursor-pointer transition ${getCorrelationColor(val)} ${
                                isHovered ? 'ring-2 ring-indigo-400 scale-105 z-20 rounded shadow-lg' : ''
                              }`}
                              title={`${rowCol} vs ${colName}: r = ${val}`}
                            >
                              {Number(val).toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hover Inspection Bar */}
            <div className="min-h-[36px] flex items-center justify-between px-4 py-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              {hoveredCell ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Inspecting Correlation:</span>
                  <span className="font-semibold text-white">{hoveredCell.row}</span>
                  <span className="text-slate-500">×</span>
                  <span className="font-semibold text-white">{hoveredCell.col}</span>
                  <span className="font-mono font-bold text-indigo-400 ml-2">
                    r = {Number(hoveredCell.val).toFixed(3)}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 ml-1">
                    {Math.abs(hoveredCell.val) >= 0.7
                      ? 'Strong Relationship'
                      : Math.abs(hoveredCell.val) >= 0.3
                      ? 'Moderate Relationship'
                      : 'Weak / No Linear Relationship'}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 italic">
                  Hover over any heatmap cell above to inspect the exact coefficient and relationship strength
                </span>
              )}
            </div>

            {/* Strong Multicollinearity Insights */}
            {strongCorrelations.length > 0 && (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                  <Flame className="w-4 h-4 text-indigo-400" />
                  <span>Strong Multicollinearity Detected (|r| ≥ 0.70)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {strongCorrelations.map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {pair.feature_a} <span className="text-slate-500">&amp;</span> {pair.feature_b}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{pair.relationship}</div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                        pair.coefficient > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {pair.coefficient > 0 ? `+${pair.coefficient.toFixed(2)}` : pair.coefficient.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
            Dataset contains fewer than 2 numerical features. Correlation matrix requires at least 2 numerical columns.
          </div>
        )}
      </div>

      {/* Complete Column Profiles Master Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Full Column Profiles</h3>
          <p className="text-xs text-slate-400 mt-0.5">Detailed statistics across all dataset columns</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Column Name</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Missing Count</th>
                <th className="py-3 px-6">Missing %</th>
                <th className="py-3 px-6">Unique Count</th>
                <th className="py-3 px-6 text-right">Outlier Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {columnProfiles.map((cp) => (
                <tr key={cp.id || cp.columnName} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-6 font-semibold text-white">{cp.columnName}</td>
                  <td className="py-3 px-6">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {cp.dataType}
                    </span>
                  </td>
                  <td className={`py-3 px-6 font-mono ${cp.missingCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {cp.missingCount}
                  </td>
                  <td className={`py-3 px-6 font-mono ${cp.missingPercentage > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {cp.missingPercentage}%
                  </td>
                  <td className="py-3 px-6 font-mono text-slate-300">{cp.uniqueCount}</td>
                  <td className="py-3 px-6 text-right">
                    {outlierColumns.includes(cp.columnName) ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        Outliers Detected
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

