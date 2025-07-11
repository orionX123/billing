import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Receipt,
  Database,
  Shield,
  Building2,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  userRole?: 'staff' | 'manager' | 'admin' | 'superadmin';
}

const Sidebar = ({ userRole = 'staff' }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Base navigation items available to all users
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: CreditCard, label: "POS", href: "/pos" },
    { icon: FileText, label: "Invoices", href: "/invoices" },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: Package, label: "Products", href: "/products" },
    { icon: Receipt, label: "Bills", href: "/bills" },
    { icon: BarChart3, label: "Reports", href: "/reports" },
  ];

  // Manager and above features
  const managerItems = userRole === 'manager' || userRole === 'admin' || userRole === 'superadmin' ? [
    { icon: Settings, label: "Settings", href: "/settings" },
  ] : [];

  // Admin and SuperAdmin only features
  const adminItems = (userRole === 'admin' || userRole === 'superadmin') ? [
    { icon: Shield, label: "Audit Logs", href: "/audit" },
    { icon: Database, label: "Backup/Restore", href: "/backup" },
  ] : [];

  // SuperAdmin only features
  const superAdminItems = userRole === 'superadmin' ? [
    { icon: Building2, label: "Super Admin", href: "/superadmin" },
  ] : [];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className={`bg-gradient-card border-r border-border h-screen transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">IRD POS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
            >
              <item.icon className="w-4 h-4" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}

        {/* Manager Features */}
        {managerItems.length > 0 && (
          <>
            <div className={`px-3 py-2 ${isCollapsed ? 'hidden' : 'block'}`}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Management
              </div>
            </div>
            {managerItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            ))}
          </>
        )}

        {/* Admin Features */}
        {adminItems.length > 0 && (
          <>
            <div className={`px-3 py-2 ${isCollapsed ? 'hidden' : 'block'}`}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </div>
            </div>
            {adminItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            ))}
          </>
        )}

        {/* SuperAdmin Features */}
        {superAdminItems.length > 0 && (
          <>
            <div className={`px-3 py-2 ${isCollapsed ? 'hidden' : 'block'}`}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                SuperAdmin
              </div>
            </div>
            {superAdminItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-border bg-gradient-card">
        <div className={`mb-2 ${isCollapsed ? 'hidden' : 'block'}`}>
          <div className="text-xs text-muted-foreground px-3">
            {user?.fullName}
            <br />
            <span className="capitalize">{user?.role}</span>
            {user?.tenant && (
              <>
                <br />
                <span className="text-[10px]">{user.tenant.name}</span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
