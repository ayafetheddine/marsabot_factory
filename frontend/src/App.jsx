import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import KnowledgeBase from './components/KnowledgeBase';
import Login from './components/Login';
import Settings from './components/Settings';
import AppShell from './components/layout/AppShell';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  return token ? (
    <AppShell>{children}</AppShell>
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
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
