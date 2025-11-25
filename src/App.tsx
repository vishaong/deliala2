import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SettingsPage from './pages/SettingsPage';
import MainPage from './pages/MainPage';
import TrackingDetailPage from './pages/TrackingDetailPage';
import { RequireAuth } from './components/RequireAuth';

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

export default App;

