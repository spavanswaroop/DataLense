import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisApi, datasetApi } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import {
  Layers, Database, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  ArrowLeft, RefreshCw, BarChart2, ShieldCheck, HelpCircle, FileText,
  Network, Flame, Download, Info, AlertCircle, HardDrive
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function AnalysisDashboard() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [dataset, setDataset] = useState(null);
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

      // Also fetch dataset metadata if available
      if (response.data.datasetId) {
        try {
          const dsRes = await datasetApi.getDatasetById(response.data.datasetId);
          setDataset(dsRes.data);
        } catch {
          // Best effort
        }
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analysis Unavailable</h2>
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analysis Failed</h2>
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

  const totalCells = rows * columns;
  const missingPercentage = totalCells > 0 ? (missingValues / totalCells) * 100 : 0;
  const duplicatePercentage = rows > 0 ? (duplicateRows / rows) * 100 : 0;
  const estimatedMemoryBytes = rows * columns * 8; // ~8 bytes per cellular float/pointer

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return {
        label: 'Excellent Quality',
        statusPill: 'High Quality (Production Ready)',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/40 border-emerald-800/60',
        bar: 'bg-emerald-500',
        dot: 'bg-emerald-400'
      };
    } else if (score >= 60) {
      return {
        label: 'Moderate Quality (Action Advised)',
        statusPill: 'Moderate Quality (Action Advised)',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-800/60',
        bar: 'bg-amber-500',
        dot: 'bg-amber-400'
      };
    } else {
      return {
        label: 'Low Quality (Requires Preprocessing)',
        statusPill: 'Critical Quality Issues (Fix Required)',
        color: 'text-rose-400',
        bg: 'bg-rose-950/40 border-rose-800/60',
        bar: 'bg-rose-500',
        dot: 'bg-rose-400'
      };
    }
  };

  const scoreBadge = getScoreBadge(qualityScore);
  const selectedProfile = columnProfiles.find(c => c.columnName === selectedColumnName) || columnProfiles[0];
  const missingColumns = columnProfiles.filter(c => c.missingCount > 0);

  // Derive dynamic prioritized alerts
  const alerts = [];
  if (strongCorrelations.length > 0) {
    alerts.push({
      severity: 'HIGH',
      title: 'Strong Multicollinearity Detected',
      desc: `${strongCorrelations.length} feature pair(s) have strong correlation (|r| ≥ 0.70). High risk of variance inflation in linear models.`,
      icon: Flame,
      color: 'text-rose-400 bg-rose-950/40 border-rose-800/60'
    });
  }
  if (missingPercentage > 15) {
    alerts.push({
      severity: 'HIGH',
      title: 'Elevated Missing Value Ratio',
      desc: `${missingValues.toLocaleString()} cells (${missingPercentage.toFixed(1)}%) are null across ${missingColumns.length} feature(s).`,
      icon: AlertTriangle,
      color: 'text-rose-400 bg-rose-950/40 border-rose-800/60'
    });
  } else if (missingPercentage > 0) {
    alerts.push({
      severity: 'MEDIUM',
      title: 'Missing Values Present',
      desc: `${missingValues.toLocaleString()} missing cell(s) detected across ${missingColumns.length} feature(s). Imputation recommended.`,
      icon: AlertCircle,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/60'
    });
  }
  if (outlierColumns.length > 0) {
    alerts.push({
      severity: 'MEDIUM',
      title: 'Statistical Outliers Detected (Tukey IQR)',
      desc: `${outlierColumns.length} feature(s) contain values beyond 1.5×IQR boundaries: [${outlierColumns.join(', ')}].`,
      icon: AlertTriangle,
      color: 'text-purple-400 bg-purple-950/40 border-purple-800/60'
    });
  }
  if (duplicateRows > 0) {
    alerts.push({
      severity: 'MEDIUM',
      title: 'Duplicate Observations Found',
      desc: `${duplicateRows.toLocaleString()} duplicate record(s) (${duplicatePercentage.toFixed(1)}%) found. Deduplication advised.`,
      icon: Database,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/60'
    });
  }

  const highSeverityCount = alerts.filter(a => a.severity === 'HIGH').length;

  const handleExportReport = () => {
    const reportData = {
      reportTitle: 'DataLens Intelligent Dataset Quality Assessment',
      datasetName: analysis.datasetName,
      analysisId: analysis.id,
      generatedAt: new Date().toISOString(),
      qualityScore: qualityScore,
      healthStatus: scoreBadge.statusPill,
      overview: {
        totalRows: rows,
        totalColumns: columns,
        fileSize: dataset?.formattedFileSize || formatBytes(estimatedMemoryBytes),
        estimatedMemoryUsage: formatBytes(estimatedMemoryBytes),
        missingCellsCount: missingValues,
        missingPercentage: Number(missingPercentage.toFixed(2)),
        duplicateRowsCount: duplicateRows,
        duplicatePercentage: Number(duplicatePercentage.toFixed(2))
      },
      alerts: alerts.map(a => ({ severity: a.severity, title: a.title, description: a.desc })),
      outliers: {
        method: 'Tukey IQR 1.5x',
        affectedColumns: outlierColumns
      },
      missingnessBreakdown: missingColumns.map(c => ({
        column: c.columnName,
        type: c.dataType,
        missingCount: c.missingCount,
        missingPercentage: c.missingPercentage
      })),
      strongCorrelations: strongCorrelations,
      columnProfiles: columnProfiles.map(c => ({
        columnName: c.columnName,
        dataType: c.dataType,
        missingCount: c.missingCount,
        missingPercentage: c.missingPercentage,
        uniqueCount: c.uniqueCount,
        statistics: c.statistics
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datalens-quality-report-${analysis.datasetName.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. HEADER: Dataset Name • Uploaded Size • Health Status Pill • Export    */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-lavender-2 dark:border-slate-800">
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
            <span className="text-xs text-slate-400 font-mono">ID: {analysis.id.slice(0, 8)}...</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {analysis.datasetName}
            </h1>
            
            {/* Uploaded File Size Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300 shadow-sm">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              {dataset?.formattedFileSize || formatBytes(estimatedMemoryBytes)}
            </span>

            {/* Health Status Pill */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${scoreBadge.bg} ${scoreBadge.color}`}>
              <span className={`w-2 h-2 rounded-full ${scoreBadge.dot} animate-pulse`}></span>
              {scoreBadge.statusPill}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Analysis completed on {analysis.completedAt ? new Date(analysis.completedAt).toLocaleString() : 'Recently'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 transition shadow-sm hover:border-slate-600"
            title="Export complete Data Quality Assessment Report (JSON)"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Report
          </button>
          <button
            onClick={fetchAnalysis}
            className="p-2.5 rounded-lg bg-slate-900 border border-lavender-2 dark:border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            Upload Another
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP METRICS ROW: Q-Score | Rows / Cols / Memory | Missing % / Duplicates*/}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Q-Score (0-100) */}
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
            <p className="text-xs font-medium text-slate-200 mt-2">{scoreBadge.label}</p>
          </div>

          <div className="mt-6">
            <div className="w-full bg-slate-950/60 rounded-full h-2.5 overflow-hidden border border-lavender-2 dark:border-slate-800">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${scoreBadge.bar}`}
                style={{ width: `${qualityScore}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Heuristic formula: 0.4C + 0.2D + 0.2V + 0.2S
            </p>
          </div>
        </div>

        {/* Card 2: Rows / Cols / Memory */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Data Dimensions & Volume
              </span>
              <span className="text-[11px] font-mono text-slate-500">2D Matrix</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">Total Rows</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{rows.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">Observations</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Features</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{columns}</p>
                <p className="text-[11px] text-slate-500">Columns / Dimensions</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              Memory Footprint:
            </span>
            <span className="font-mono font-semibold text-emerald-400">
              ~{formatBytes(estimatedMemoryBytes)}
            </span>
          </div>
        </div>

        {/* Card 3: Missing % / Duplicate % */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                Integrity & Completeness
              </span>
              <span className="text-[11px] font-mono text-slate-500">Cleanliness</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">Missing Rate</span>
                <p className={`text-2xl font-bold font-mono mt-1 ${missingValues > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {missingPercentage.toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500">{missingValues.toLocaleString()} null cells</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Duplicate Rate</span>
                <p className={`text-2xl font-bold font-mono mt-1 ${duplicateRows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {duplicatePercentage.toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500">{duplicateRows.toLocaleString()} duplicate rows</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Valid Observations:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {(rows - duplicateRows).toLocaleString()} rows
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ALERT BANNER: Anomaly & Rule Violations Feed                          */}
      {/* ========================================================================= */}
      <div className={`p-5 rounded-2xl border backdrop-blur transition ${
        alerts.length === 0
          ? 'bg-emerald-950/20 border-emerald-800/40'
          : highSeverityCount > 0
            ? 'bg-rose-950/20 border-rose-800/40'
            : 'bg-amber-950/20 border-amber-800/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-lavender-2 dark:border-lavender-2 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            {alerts.length === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : highSeverityCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {alerts.length === 0
                ? 'Clean Dataset Health: Zero Anomalies Detected'
                : `Dataset Health Feed: ${alerts.length} Potential Issue(s) Identified`}
            </h3>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            alerts.length === 0
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              : highSeverityCount > 0
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
          }`}>
            {alerts.length === 0
              ? 'Optimal Quality'
              : highSeverityCount > 0
                ? `${highSeverityCount} High Severity Alert(s)`
                : `${alerts.length} Notice(s)`}
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
            {alerts.map((alert, idx) => {
              const IconComp = alert.icon;
              return (
                <div key={idx} className={`p-3.5 rounded-xl border flex items-start gap-3 bg-slate-950/60 ${alert.color}`}>
                  <IconComp className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{alert.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold bg-slate-900 border border-lavender-2 dark:border-slate-800">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 pt-3">
            No extreme outliers, null cells, duplicates, or excessive feature collinearity detected. The dataset passes standard production hygiene standards.
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. SIDE-BY-SIDE: Missing Values & Imputation | Outlier Detection (IQR)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Values Breakdown & Imputation Tips */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Missing Values & Imputation Tips
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {missingColumns.length} feature(s) affected
            </span>
          </div>

          {missingColumns.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">100% Complete Observations</p>
              <p className="text-xs text-slate-400 mt-1">
                Zero null values found across all {columns} columns. No imputation required.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[290px] overflow-y-auto pr-1 space-y-2">
              {missingColumns.map((col) => (
                <div key={col.columnName} className="pt-2 pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{col.columnName}</span>
                      <span className="text-xs text-slate-400 ml-2">({col.dataType})</span>
                    </div>
                    <span className="font-mono text-amber-400 text-xs font-semibold">
                      {col.missingCount} nulls ({col.missingPercentage}%)
                    </span>
                  </div>
                  {/* Progress bar representing missing percentage */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-lavender-2 dark:border-slate-800">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(col.missingPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    💡 Tip: Use {col.dataType === 'NUMERICAL' ? 'Median Imputation (robust against skewness)' : 'Mode (Most Frequent) Imputation'}.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistical Outlier Detection (Tukey's IQR) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              Statistical Outlier Detection (Tukey's IQR)
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
              1.5× IQR Boundary
            </span>
          </div>

          <div className="p-4 rounded-xl bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300">Tukey Fencing Rule</span>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Any value falling outside these fences is categorized as a statistical anomaly.
            </p>
          </div>

          {outlierColumns.length === 0 ? (
            <div className="p-5 text-center rounded-xl bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5">No Extreme Outliers</p>
              <p className="text-xs text-slate-400 mt-0.5">All numerical features sit comfortably within expected dispersion bounds.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {outlierColumns.map((colName) => (
                <div key={colName} className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{colName}</span>
                  </div>
                  <span className="text-xs text-purple-300 font-medium">
                    Outliers Detected (Consider Winsorization or Robust Scaling)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE FEATURE VISUALIZER: Dropdown + 10-Bin Histogram + Stats   */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              Interactive Feature Visualizer
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any column to view its 10-bin histogram, variance distribution, and quartile percentiles
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400">Select Feature:</label>
            <select
              value={selectedColumnName}
              onChange={(e) => setSelectedColumnName(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className="lg:col-span-2 h-[270px] w-full bg-slate-950/40 rounded-xl p-4 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
              {selectedProfile.dataType === 'NUMERICAL' ? (
                selectedProfile.statistics?.histogram && selectedProfile.statistics.histogram.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedProfile.statistics.histogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No histogram bins available for this column.
                  </div>
                )
              ) : (
                selectedProfile.statistics?.top_categories && selectedProfile.statistics.top_categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedProfile.statistics.top_categories} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                      <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={10} width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Categorical frequencies not computed.
                  </div>
                )
              )}
            </div>

            {/* Feature Stats Summary Cards */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Feature Type</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  <span className="font-mono text-emerald-400">{selectedProfile.dataType}</span>
                  {outlierColumns.includes(selectedProfile.columnName) && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                      Outliers
                    </span>
                  )}
                </p>
              </div>

              {selectedProfile.dataType === 'NUMERICAL' && selectedProfile.statistics ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
                    <span className="text-slate-400">Mean</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedProfile.statistics.mean ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
                    <span className="text-slate-400">Std Dev</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedProfile.statistics.std ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
                    <span className="text-slate-400">Min</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedProfile.statistics.min ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80">
                    <span className="text-slate-400">Max</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedProfile.statistics.max ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80 col-span-2 flex items-center justify-between">
                    <span className="text-slate-400">Median (50%)</span>
                    <span className="font-mono font-bold text-emerald-400">{selectedProfile.statistics.median ?? 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Distinct Classes</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedProfile.uniqueCount ?? 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-lavender/20 dark:bg-slate-950/40 border border-lavender-2 dark:border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Most Frequent (Mode)</span>
                    <span className="font-mono font-bold text-purple-400">{selectedProfile.statistics?.top_value ?? 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. PEARSON CORRELATION HEATMAP: Matrix + Tooltips + Multicollinearity     */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-400" />
              Pearson Feature Correlation Heatmap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pairwise linear coefficients r ∈ [-1.0, +1.0] across all numerical variables
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>-1.0 (Inverse)</span>
            <div className="flex h-3 w-28 rounded overflow-hidden border border-slate-700">
              <span className="flex-1 bg-rose-600"></span>
              <span className="flex-1 bg-rose-800"></span>
              <span className="flex-1 bg-slate-800"></span>
              <span className="flex-1 bg-emerald-800"></span>
              <span className="flex-1 bg-emerald-500"></span>
            </div>
            <span>+1.0 (Positive)</span>
          </div>
        </div>

        {corrColumns.length >= 2 ? (
          <div className="space-y-4">
            {/* Interactive Grid Table */}
            <div className="overflow-x-auto pb-2">
              <table className="border-collapse text-center mx-auto text-xs font-mono">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-400 font-sans font-semibold text-xs border border-lavender-2 dark:border-slate-800">
                      Feature
                    </th>
                    {corrColumns.map((col) => (
                      <th
                        key={col}
                        className="p-2 text-slate-300 font-sans font-semibold text-xs border border-lavender-2 dark:border-slate-800 max-w-[100px] truncate"
                        title={col}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corrMatrix.map((rowVals, rIdx) => {
                    const rowName = corrColumns[rIdx];
                    return (
                      <tr key={rowName}>
                        <td
                          className="p-2 text-left font-sans font-semibold text-slate-900 dark:text-white border border-lavender-2 dark:border-slate-800 max-w-[120px] truncate"
                          title={rowName}
                        >
                          {rowName}
                        </td>
                        {rowVals.map((val, cIdx) => {
                          const colName = corrColumns[cIdx];
                          const isHovered =
                            hoveredCell &&
                            hoveredCell.row === rowName &&
                            hoveredCell.col === colName;
                          return (
                            <td
                              key={colName}
                              onMouseEnter={() => setHoveredCell({ row: rowName, col: colName, val })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`p-2.5 transition-all cursor-pointer border border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80 ${getCorrelationColor(
                                val
                              )} ${isHovered ? 'ring-2 ring-white scale-110 z-10' : ''}`}
                              title={`${rowName} ↔ ${colName}: r = ${val}`}
                            >
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Hover Inspection Bar */}
            <div className="p-3 rounded-xl bg-lavender/20 dark:bg-slate-950/60 border border-lavender-2 dark:border-lavender-2 dark:border-slate-800 flex items-center justify-between text-xs">
              {hoveredCell ? (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {hoveredCell.row} <span className="text-slate-500">↔</span> {hoveredCell.col}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Pearson r = {hoveredCell.val.toFixed(3)}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({hoveredCell.val >= 0.7
                      ? 'Strong Positive'
                      : hoveredCell.val >= 0.3
                      ? 'Moderate Positive'
                      : hoveredCell.val <= -0.7
                      ? 'Strong Negative'
                      : hoveredCell.val <= -0.3
                      ? 'Moderate Negative'
                      : 'Negligible / Weak'} correlation)
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
                      className="p-3 rounded-lg bg-slate-900/80 border border-lavender-2 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {pair.feature_a} <span className="text-slate-500">&</span> {pair.feature_b}
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
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-lavender-2 dark:border-lavender-2 dark:border-slate-800/80 text-slate-400 text-xs">
            Dataset contains fewer than 2 numerical features. Correlation matrix requires at least 2 numerical columns.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. SCHEMA & COLUMN PROFILES MASTER TABLE: Types, Cardinality, Flags       */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-lavender-2 dark:border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
        <div className="p-5 border-b border-lavender-2 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Schema & Column Profiles Master Diagnostics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive structural diagnostics: Inferred types, distinct cardinality, null counts, and anomaly flags
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded bg-slate-950 border border-lavender-2 dark:border-slate-800 shrink-0">
            {columnProfiles.length} Total Registered Columns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-lavender/50 dark:bg-slate-950/60 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 border-b border-lavender-2 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Column Name</th>
                <th className="py-3.5 px-6">Inferred Type</th>
                <th className="py-3.5 px-6">Cardinality (Distinct)</th>
                <th className="py-3.5 px-6">Missing Count</th>
                <th className="py-3.5 px-6">Missing Rate</th>
                <th className="py-3.5 px-6 text-right">Data Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {columnProfiles.map((cp) => {
                const hasOutlier = outlierColumns.includes(cp.columnName);
                const hasMissing = cp.missingCount > 0;
                const isHighCardinality = cp.uniqueCount > (rows * 0.95) && rows > 50;

                return (
                  <tr key={cp.id || cp.columnName} className="hover:bg-lavender/30 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                      {cp.columnName}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                        cp.dataType === 'NUMERICAL'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                      }`}>
                        {cp.dataType}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300 text-xs">
                      {cp.uniqueCount !== null && cp.uniqueCount !== undefined ? cp.uniqueCount.toLocaleString() : 'N/A'}
                    </td>
                    <td className={`py-3.5 px-6 font-mono text-xs ${hasMissing ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                      {cp.missingCount.toLocaleString()}
                    </td>
                    <td className={`py-3.5 px-6 font-mono text-xs ${hasMissing ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                      {cp.missingPercentage}%
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {hasOutlier && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            ⚠️ Outliers
                          </span>
                        )}
                        {hasMissing && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            ⚠️ Nulls
                          </span>
                        )}
                        {isHighCardinality && cp.dataType === 'CATEGORICAL' && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                            ℹ️ High Cardinality
                          </span>
                        )}
                        {!hasOutlier && !hasMissing && !isHighCardinality && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
