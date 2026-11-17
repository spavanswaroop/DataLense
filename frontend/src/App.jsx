import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import DatasetUpload from './pages/DatasetUpload';
import DatasetsList from './pages/DatasetsList';
import AnalysisDashboard from './pages/AnalysisDashboard';
import { BarChart3, Database, UploadCloud, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur-md sticky top-0 z-50 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100/80 dark:bg-blue-950/60 rounded-xl text-royal-blue dark:text-baby-blue-ice border border-blue-200/60 dark:border-blue-800/40 shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition">
            Data<span className="text-royal-blue dark:text-baby-blue-ice">Lens</span>
          </Link>
          <span className="ml-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-slate-800 text-royal-blue dark:text-baby-blue-ice border border-blue-200/60 dark:border-slate-700 rounded-full">
            Observatory
          </span>
        </div>

        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition ${
                  isActive('/')
                    ? 'text-royal-blue dark:text-alice-blue bg-blue-100/80 dark:bg-periwinkle-3/20 border border-blue-200/80 dark:border-periwinkle-2/40 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-royal-blue dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/datasets"
                className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition flex items-center gap-1.5 ${
                  isActive('/datasets') || location.pathname.startsWith('/analyses/')
                    ? 'text-royal-blue dark:text-alice-blue bg-blue-100/80 dark:bg-periwinkle-3/20 border border-blue-200/80 dark:border-periwinkle-2/40 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-royal-blue dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`}
              >
                <Database className="w-4 h-4" />
                Datasets
              </Link>
              <Link
                to="/upload"
                className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition flex items-center gap-1.5 ${
                  isActive('/upload')
                    ? 'text-royal-blue dark:text-alice-blue bg-blue-100/80 dark:bg-periwinkle-3/20 border border-blue-200/80 dark:border-periwinkle-2/40 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-royal-blue dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Upload
              </Link>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to White Theme' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/60 transition"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-royal-blue" />
                )}
              </button>

              <div className="h-5 w-px bg-blue-100 dark:bg-slate-800 mx-1"></div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
                <UserIcon className="w-3.5 h-3.5 text-royal-blue dark:text-baby-blue-ice" />
                <span className="font-semibold text-slate-800 dark:text-white">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-white/60 dark:hover:bg-slate-800/60 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-royal-blue hover:bg-royal-blue-hover rounded-xl shadow-md shadow-blue-500/20 transition"
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
      <ThemeProvider>
        <Router>
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200 flex flex-col font-sans">
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
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <DatasetUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/datasets"
                element={
                  <ProtectedRoute>
                    <DatasetsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyses/:id"
                element={
                  <ProtectedRoute>
                    <AnalysisDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>

          <footer className="border-t border-[var(--nav-border)] bg-[var(--bg-card)] py-4 text-center text-xs text-slate-500 transition-colors duration-200">
            DataLens Architecture • React.js + Spring Boot + FastAPI + PostgreSQL
          </footer>
        </div>
      </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
