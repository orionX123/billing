
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have the required permissions to access this page.
            </p>
            <div className="text-sm text-muted-foreground">
              Required role: {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
              <br />
              Your role: {user?.role}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
