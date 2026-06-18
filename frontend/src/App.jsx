import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CollegeProvider } from './context/CollegeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Contact from './pages/Contact';

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// 1. General Private Route Guard
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-gray-500">Loading session...</div>;
  }

  return token ? children : <Navigate to="/login" replace />;
};

// 2. Role Authorization Route Guard
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-gray-500">Loading authority...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user?.role);
  return hasAccess ? children : <Navigate to="/home" replace />;
};

function App() {
  return (
    <Router>
      <CollegeProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col justify-between">
            <div>
              {/* Header Navbar */}
              <Navbar />
              
              {/* API Core Page Router */}
              <Routes>
                {/* Public Access */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/superadmin-login" element={<SuperAdminLogin />} />
                <Route path="/contact" element={<Contact />} />

                {/* Onboarding interest selector */}
                <Route
                  path="/onboarding"
                  element={
                    <PrivateRoute>
                      <Onboarding />
                    </PrivateRoute>
                  }
                />

                {/* College Feed Portal */}
                <Route
                  path="/home"
                  element={
                    <PrivateRoute>
                      <Home />
                    </PrivateRoute>
                  }
                />

                {/* Student Profile page */}
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />

                {/* College Admin moderations dashboard */}
                <Route
                  path="/admin"
                  element={
                    <RoleRoute allowedRoles={['Admin']}>
                      <AdminDashboard />
                    </RoleRoute>
                  }
                />

                {/* Super Admin system dashboard */}
                <Route
                  path="/superadmin"
                  element={
                    <RoleRoute allowedRoles={['SuperAdmin']}>
                      <SuperAdminDashboard />
                    </RoleRoute>
                  }
                />

                {/* Fallback routing redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            {/* Footer */}
            <Footer />
          </div>
        </AuthProvider>
      </CollegeProvider>
    </Router>
  );
}

export default App;
