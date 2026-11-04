import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { datasetApi } from '../services/api';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, ArrowRight, Loader2, Database } from 'lucide-react';

export default function DatasetUpload() {
  const [file, setFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file type. Only CSV files (.csv) are supported.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB maximum limit.');
      return;
    }

    setFile(selectedFile);
    if (!datasetName) {
      const defaultName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setDatasetName(defaultName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV dataset to upload.');
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (datasetName.trim()) {
      formData.append('name', datasetName.trim());
    }

    try {
      const response = await datasetApi.uploadDataset(formData, (percent) => {
        setUploadProgress(percent);
      });
      setUploadedDataset(response.data);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to upload dataset. Please check your network connection.');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDatasetName('');
    setUploadedDataset(null);
    setUploadProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Upload Dataset</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload your CSV dataset for quality profiling and automated analysis
          </p>
        </div>
        <Link
          to="/datasets"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          View Dataset History
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {uploadedDataset ? (
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Dataset Uploaded Successfully!</h2>
            <p className="text-sm text-slate-400 mt-1">
              Your file has been validated and safely stored in the isolated repository.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Dataset Name</span>
              <p className="text-sm font-semibold text-white mt-1 truncate">{uploadedDataset.name}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">File Size</span>
              <p className="text-sm font-semibold text-white mt-1">{uploadedDataset.formattedFileSize}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Rows</span>
              <p className="text-sm font-semibold text-emerald-400 mt-1">{uploadedDataset.rowCount?.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Columns</span>
              <p className="text-sm font-semibold text-emerald-400 mt-1">{uploadedDataset.columnCount}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Upload Another
            </button>
            <button
              onClick={async () => {
                try {
                  const { analysisApi } = await import('../services/api');
                  const res = await analysisApi.triggerAnalysis(uploadedDataset.id);
                  navigate(`/analyses/${res.data.id}`);
                } catch (err) {
                  alert('Analysis failed: ' + (err.response?.data?.message || err.message));
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
            >
              <span>Analyze Dataset Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
              dragActive
                ? 'border-emerald-500 bg-emerald-950/20'
                : file
                ? 'border-slate-600 bg-slate-900/60'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 mb-4 border border-emerald-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>

            <p className="text-base font-semibold text-white">
              {dragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here, or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports CSV files up to 50MB
            </p>
          </div>

          {/* Selected File Details */}
          {file && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 rounded-lg text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dataset Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Dataset Name <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g. Customer Churn Q3 2026"
              className="mt-2 w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition"
            />
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Uploading and parsing dataset...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Dataset...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Validate Dataset</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

