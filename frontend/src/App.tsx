import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { DomainLookup } from './pages/DomainLookup'
import { CSVUpload } from './pages/CSVUpload'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'
import { Auth } from './pages/Auth'
import { useAuth } from './contexts/AuthContext'
import { Loader2 } from 'lucide-react'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/lookup" element={
            <ProtectedRoute>
              <DomainLookup />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <CSVUpload />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  )
}

export default App
