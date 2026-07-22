import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardHome } from './pages/DashboardHome';
import { ShiftAssignmentsView } from './pages/ShiftAssignmentsView';
import { InventoryView } from './pages/InventoryView';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginView from './pages/LoginView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardHome />} />
                  <Route path="/shifts" element={<ShiftAssignmentsView />} />
                  <Route path="/inventory" element={<InventoryView />} />
                  <Route path="*" element={
                    <div className="flex flex-col items-center justify-center h-full pt-20">
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                      <p className="text-lg text-gray-600 mb-4">Page not found</p>
                      <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Return to Dashboard</a>
                    </div>
                  } />
                </Routes>
              </Layout>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
