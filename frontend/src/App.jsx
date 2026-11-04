import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { BarChart3, Database, Shield, Layers, UploadCloud } from 'lucide-react';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Data<span className="text-emerald-400">Lens</span>
              </span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                MVP v1.0
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="px-3 py-1.5 text-sm font-medium rounded-md text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
              >
                Dashboard
              </Link>
              <span className="px-3 py-1.5 text-sm font-medium text-slate-500 cursor-not-allowed">
                Uploads (Week 3)
              </span>
              <span className="px-3 py-1.5 text-sm font-medium text-slate-500 cursor-not-allowed">
                Models (Week 6)
              </span>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
          DataLens Architecture • React.js + Spring Boot + FastAPI + PostgreSQL
        </footer>
      </div>
    </Router>
  );
}
