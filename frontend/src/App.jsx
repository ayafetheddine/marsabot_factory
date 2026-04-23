import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AppShell from './components/layout/AppShell';
import './App.css';

function ProtectedRoute() {
  const token = localStorage.getItem('token');

  return token ? (
    <AppShell>
      <Dashboard />
    </AppShell>
  ) : (
    <Navigate to="/login" replace />
  );
}

function LoginRoute() {
  const token = localStorage.getItem('token');

  return token ? <Navigate to="/" replace /> : <Login />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={<ProtectedRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
