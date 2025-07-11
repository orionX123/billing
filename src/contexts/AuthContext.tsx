
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
}

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'staff' | 'manager' | 'admin' | 'superadmin';
  tenantId?: string;
  tenant?: Tenant;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const demoUsers: User[] = [
  {
    id: "USR-SA-001",
    username: "superadmin",
    email: "superadmin@system.com",
    fullName: "Super Administrator",
    role: "superadmin"
  },
  {
    id: "USR-T1-001", 
    username: "admin",
    email: "admin@tenant1.com",
    fullName: "Tenant Admin",
    role: "admin",
    tenantId: "TENANT-001",
    tenant: {
      id: "TENANT-001",
      name: "ABC Trading Pvt Ltd",
      subdomain: "abc-trading",
      status: "active"
    }
  },
  {
    id: "USR-T1-002",
    username: "manager",
    email: "manager@tenant1.com", 
    fullName: "Store Manager",
    role: "manager",
    tenantId: "TENANT-001",
    tenant: {
      id: "TENANT-001",
      name: "ABC Trading Pvt Ltd",
      subdomain: "abc-trading",
      status: "active"
    }
  },
  {
    id: "USR-T1-003",
    username: "cashier",
    email: "cashier@tenant1.com",
    fullName: "Cashier Staff",
    role: "staff",
    tenantId: "TENANT-001", 
    tenant: {
      id: "TENANT-001",
      name: "ABC Trading Pvt Ltd",
      subdomain: "abc-trading",
      status: "active"
    }
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setTenant(userData.tenant || null);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    const foundUser = demoUsers.find(u => u.email === credentials.email);
    
    if (foundUser && credentials.password === 'password123') {
      setUser(foundUser);
      setTenant(foundUser.tenant || null);
      localStorage.setItem('current_user', JSON.stringify(foundUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setTenant(null);
    localStorage.removeItem('current_user');
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
      isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
