import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import JobList from './pages/JobList'
import Upload from './pages/Upload'
import Results from './pages/Results'

// A slightly more polished root setup with a clean structure and comments
// Uses a semantic wrapper and consistent formatting for readability.

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Global header and navigation */}
      <App />
      {/* Main application routes */}
      <main className="min-h-screen bg-gray-50 font-sans">
        <Routes>
          <Route path="/" element={<JobList />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </main>
    </BrowserRouter>
  </React.StrictMode>
)
