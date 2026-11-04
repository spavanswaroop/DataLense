import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { BarChart3, LogOut, User as UserIcon } from 'lucide-react';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <Link to="/" className="text-xl font-bold tracking-tight text-white hover:opacity-90 transition">
            Data<span className="text-emerald-400">Lens</span>
          </Link>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
            MVP v1.0
          </span>
        </div>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className="px-3 py-1.5 text-sm font-medium rounded-md text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
              >
                Dashboard
              </Link>
              <div className="h-5 w-px bg-slate-800 mx-1"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-white">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>

          <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
            DataLens Architecture • React.js + Spring Boot + FastAPI + PostgreSQL
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
