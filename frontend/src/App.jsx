import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PatientChat from './pages/PatientChat';
import DoctorDashboard from './pages/DoctorDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PatientChat />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
