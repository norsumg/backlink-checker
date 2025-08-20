import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { DomainLookup } from './pages/DomainLookup'
import { CSVUpload } from './pages/CSVUpload'
import { Dashboard } from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lookup" element={<DomainLookup />} />
          <Route path="/upload" element={<CSVUpload />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
