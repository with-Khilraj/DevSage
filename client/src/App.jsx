/**
 * DevSage Application
 * Main application component with routing
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import CodeSuggestionsDemoPage from './pages/CodeSuggestionsDemoPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Routes>
              {/* Demo Routes */}
              <Route path="/demo/suggestions" element={<CodeSuggestionsDemoPage />} />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/demo/suggestions" replace />} />

              {/* Catch All */}
              <Route path="*" element={<Navigate to="/demo/suggestions" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
