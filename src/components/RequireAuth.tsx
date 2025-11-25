import { Navigate } from 'react-router-dom';
import { storage } from '../utils/storage';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const credentials = storage.getCredentials();
  
  if (!credentials) {
    return <Navigate to="/settings" replace />;
  }
  
  return <>{children}</>;
}
