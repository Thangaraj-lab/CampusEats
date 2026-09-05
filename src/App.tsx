import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { ConflictModal } from './components/student/ConflictModal';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterStudentPage } from './pages/auth/RegisterStudentPage';
import { RegisterVendorPage } from './pages/auth/RegisterVendorPage';

import { StudentHomePage } from './pages/student/StudentHomePage';
import { VendorMenuPage } from './pages/student/VendorMenuPage';
import { CartPage } from './pages/student/CartPage';
import { OrderTrackingPage } from './pages/student/OrderTrackingPage';
import { OrderHistoryPage } from './pages/student/OrderHistoryPage';

import { VendorKitchenDashboard } from './pages/vendor/VendorKitchenDashboard';
import { VendorMenuManagement } from './pages/vendor/VendorMenuManagement';
import { VendorSettingsPage } from './pages/vendor/VendorSettingsPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
              <div>
                <Header />
                <ToastContainer />
                <ConflictModal />

                <main>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register/student" element={<RegisterStudentPage />} />
                    <Route path="/register/vendor" element={<RegisterVendorPage />} />

                    {/* Student Routes */}
                    <Route
                      path="/student"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <StudentHomePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/vendor/:vendorId"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <VendorMenuPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/cart"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <CartPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/orders"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <OrderHistoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/orders/:orderId"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <OrderTrackingPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Vendor Kitchen Routes */}
                    <Route
                      path="/vendor"
                      element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorKitchenDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/vendor/menu"
                      element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorMenuManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/vendor/settings"
                      element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorSettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminDashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
