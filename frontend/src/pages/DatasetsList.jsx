import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { datasetApi } from '../services/api';
import { Database, UploadCloud, Trash2, Calendar, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function DatasetsList() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchDatasets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await datasetApi.getDatasets();
      setDatasets(response.data);
    } catch (err) {
      setError('Failed to load datasets. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await datasetApi.deleteDataset(id);
      setDatasets((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert('Failed to delete dataset: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" />
            Uploaded
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/60 text-blue-400 border border-blue-800/60">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 text-purple-400 border border-purple-800/60">
            <Layers className="w-3 h-3" />
            Analyzed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/60 text-red-400 border border-red-800/60">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  const totalRows = datasets.reduce((sum, d) => sum + (d.rowCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dataset Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse and manage your uploaded CSV datasets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDatasets}
            disabled={loading}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Dataset
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Datasets</span>
          <p className="text-2xl font-bold text-white mt-2">{datasets.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Rows Profiled</span>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{totalRows.toLocaleString()}</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Storage System</span>
          <p className="text-2xl font-bold text-blue-400 mt-2">Local Isolated</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Datasets Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <p className="text-sm">Loading your datasets...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">No Datasets Found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                You haven't uploaded any CSV files yet. Upload a dataset to begin automated quality analysis.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition"
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
                  <th className="py-3.5 px-6">Dataset Name</th>
                  <th className="py-3.5 px-6">Size</th>
                  <th className="py-3.5 px-6">Rows</th>
                  <th className="py-3.5 px-6">Columns</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Uploaded</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-emerald-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{dataset.name}</p>
                          <p className="text-xs text-slate-400">{dataset.originalFilename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono text-xs">
                      {dataset.formattedFileSize}
                    </td>
                    <td className="py-4 px-6 font-semibold text-emerald-400 font-mono">
                      {dataset.rowCount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">
                      {dataset.columnCount}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(dataset.status)}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(dataset.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(dataset.id, dataset.name)}
                        disabled={deletingId === dataset.id}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
