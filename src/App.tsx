import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SettingsPage from './pages/SettingsPage';
import MainPage from './pages/MainPage';
import TrackingDetailPage from './pages/TrackingDetailPage';
import { storage } from './utils/storage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/settings" 
          element={<SettingsPage />} 
        />
        <Route 
          path="/" 
          element={
            <RequireAuth>
              <MainPage />
            </RequireAuth>
          } 
        />
        <Route 
          path="/tracking/:id" 
          element={
            <RequireAuth>
              <TrackingDetailPage />
            </RequireAuth>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const credentials = storage.getCredentials();
  
  if (!credentials) {
    return <Navigate to="/settings" replace />;
  }
  
  return <>{children}</>;
}

export default App;

