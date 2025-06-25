import { Navigate } from 'react-router';
import { CatalogConnectionProvider, useCatalogConnection } from '@/context/CatalogConnectionContext';
import { CatalogProvider } from '@/service/catalog/provider';

function ProtectedRouteInner({ children }: { children: React.ReactNode }) {
  const { jellyfinService } = useCatalogConnection();
  
  const isAuthenticated = jellyfinService?.isAuthenticated();
  console.log('ProtectedRoute check - isAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Authenticated, rendering protected content');
  return (
    <CatalogProvider>
      {children}
    </CatalogProvider>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <CatalogConnectionProvider>
      <ProtectedRouteInner>{children}</ProtectedRouteInner>
    </CatalogConnectionProvider>
  );
}