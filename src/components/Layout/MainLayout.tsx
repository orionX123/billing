
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
  userRole?: 'staff' | 'manager' | 'admin' | 'superadmin';
}

const MainLayout = ({ children, userRole }: MainLayoutProps) => {
  const { user } = useAuth();
  const effectiveRole = userRole || user?.role || 'staff';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={effectiveRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
