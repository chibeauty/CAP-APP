import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { Sidebar } from './components/navigation/Sidebar';
import { BottomNav } from './components/navigation/BottomNav';
import { HamburgerMenu } from './components/navigation/HamburgerMenu';
import { FloatingPanicButton } from './components/emergency/FloatingPanicButton';

// Auth pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Main app pages
import { Dashboard } from './pages/Dashboard';
import { EmergencyAlert } from './pages/EmergencyAlert';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Communications } from './pages/Communications';
import { SecurityDashboard } from './pages/SecurityDashboard';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Wearables } from './pages/Wearables';
import { DecoySetup } from './pages/DecoySetup';
import { DecoyHome } from './pages/DecoyHome';
import { Reports } from './pages/Reports';
import { Help } from './pages/Help';

function ProtectedRoute({ children }: { children: ReactNode }) {
  // TEMPORARILY DISABLED: Allow access without authentication
  // const { user, loading } = useAuth();

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
  //         <p className="text-gray-600 dark:text-gray-400">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();
  
  return (
    <>
      <Sidebar />
      <HamburgerMenu />
      <main 
        className="transition-all duration-300"
        style={{ marginLeft: isCollapsed ? '80px' : '256px' }}
      >
        {children}
      </main>
      <BottomNav />
      <FloatingPanicButton />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/decoy" element={<DecoyHome />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EmergencyAlert />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Events />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EventDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/communications"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Communications />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SecurityDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wearables"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Wearables />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/decoy-setup"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DecoySetup />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Help />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

