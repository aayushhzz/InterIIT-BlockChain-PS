import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ComparePage from './pages/ComparePage';
import bootstrap from 'bootstrap/dist/css/bootstrap.min.css';
import bootstrapjs from 'bootstrap/dist/js/bootstrap.bundle.min.js';
function App() {
  return (
      <Router>
        <div className="App">
          <Routes>
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
  );
}

export default App;
