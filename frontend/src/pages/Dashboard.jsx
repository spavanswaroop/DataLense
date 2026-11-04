import React, { useState, useEffect } from 'react';
import { healthApi } from '../services/api';
import { Activity, Server, Cpu, CheckCircle2, AlertCircle, Database, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [mlStatus, setMlStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const backendRes = await healthApi.checkBackendHealth();
      setBackendStatus(backendRes.data.status === 'UP' ? 'online' : 'error');
    } catch {
      setBackendStatus('offline');
    }

    try {
      const mlRes = await healthApi.checkMlServiceViaBackend();
      setMlStatus(mlRes.data.ml_service_connection === 'CONNECTED' ? 'online' : 'offline');
    } catch {
      setMlStatus('offline');
    }

    setLastCheck(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">System Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            DataLens Architecture Status & Health Dashboard
          </p>
        </div>
        <button
          onClick={checkSystemHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Service Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Frontend Card */}
        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">UI Layer</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">React + Vite</h3>
              <p className="text-xs text-slate-400">Port 5173</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-emerald-400">Active (Running)</span>
          </div>
        </div>

        {/* Backend Card */}
        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Main Backend</span>
            {backendStatus === 'online' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Spring Boot 3</h3>
              <p className="text-xs text-slate-400">Port 8080 (REST API)</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`text-xs font-medium capitalize ${
                backendStatus === 'online' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {backendStatus}
            </span>
          </div>
        </div>

        {/* ML Service Card */}
        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ML Microservice</span>
            {mlStatus === 'online' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-purple-400" />
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">FastAPI Engine</h3>
              <p className="text-xs text-slate-400">Port 8000 (Internal)</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                mlStatus === 'online' ? 'bg-emerald-400' : 'bg-purple-400'
              }`}
            ></span>
            <span
              className={`text-xs font-medium capitalize ${
                mlStatus === 'online' ? 'text-emerald-400' : 'text-purple-400'
              }`}
            >
              {mlStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Week 1 Status Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/40">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Week 1 Foundation Complete</h2>
            <p className="text-sm text-slate-300 mt-1">
              Monorepo architecture established: React + Vite frontend, Java 17 Spring Boot backend, and Python FastAPI ML microservice.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              Last health sync: {lastCheck || 'Initial load'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

