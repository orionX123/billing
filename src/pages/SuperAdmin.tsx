import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  Activity, 
  Settings,
  Database,
  Shield,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import TenantManagement from "@/components/TenantManagement/TenantManagement";
import UserManagement from "@/components/UserManagement/UserManagement";
import BackupRestore from "@/components/BackupRestore/BackupRestore";

interface SystemMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  systemUptime: string;
  databaseSize: string;
  activeConnections: number;
  averageResponseTime: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const SuperAdmin = () => {
  const { toast } = useToast();
  const [userRole] = useState<'superadmin' | 'admin' | 'staff'>('superadmin');
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    systemUptime: "99.9%",
    databaseSize: "2.5 GB",
    activeConnections: 45,
    averageResponseTime: 120
  });
  
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - In real app, this would come from APIs
  useEffect(() => {
    // Simulate loading system metrics
    const mockMetrics: SystemMetrics = {
      totalTenants: 25,
      activeTenants: 22,
      totalUsers: 148,
      totalRevenue: 125000,
      systemUptime: "99.97%",
      databaseSize: "2.8 GB",
      activeConnections: 67,
      averageResponseTime: 95
    };

    const mockAlerts: SystemAlert[] = [
      {
        id: "ALERT-001",
        type: "warning",
        title: "High CPU Usage",
        message: "Server CPU usage has exceeded 85% for the last 10 minutes",
        timestamp: "2024-07-10T10:30:00Z",
        resolved: false
      },
      {
        id: "ALERT-002",
        type: "info",
        title: "Database Backup Completed",
        message: "Daily database backup completed successfully",
        timestamp: "2024-07-10T02:00:00Z",
        resolved: true
      },
      {
        id: "ALERT-003",
        type: "error",
        title: "Payment Gateway Error",
        message: "Payment processing failed for 3 transactions",
        timestamp: "2024-07-10T09:15:00Z",
        resolved: false
      }
    ];

    setMetrics(mockMetrics);
    setAlerts(mockAlerts);
  }, []);

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      case 'info': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Activity;
      default: return Activity;
    }
  };

  const formatAlertType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Check if user has super admin access
  if (userRole !== 'superadmin') {
    return (
      <MainLayout userRole={userRole}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need super administrator privileges to access this page.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userRole={userRole}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide management and monitoring</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Tenants</div>
                      <div className="text-2xl font-bold">{metrics.totalTenants}</div>
                    </div>
                    <Building className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-success">Active Tenants</div>
                      <div className="text-2xl font-bold text-success">{metrics.activeTenants}</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                      <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                    </div>
                    <Users className="w-8 h-8 text-info" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-2xl font-bold">NPR {metrics.totalRevenue.toLocaleString()}</div>
                    </div>
                    <DollarSign className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Real-time system performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">System Uptime</span>
                    <Badge className="bg-success text-success-foreground">{metrics.systemUptime}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Database Size</span>
                    <span className="text-sm text-muted-foreground">{metrics.databaseSize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Connections</span>
                    <span className="text-sm text-muted-foreground">{metrics.activeConnections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Response Time</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageResponseTime}ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Recent system alerts and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert) => {
                        const AlertIcon = getAlertIcon(alert.type);
                        return (
                          <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                            <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{alert.title}</span>
                                <Badge className={getAlertBadgeColor(alert.type)}>
                                  {formatAlertType(alert.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants">
            <TenantManagement />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage system-wide settings and configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start gap-2">
                    <Settings className="w-4 h-4" />
                    Global Settings
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <Shield className="w-4 h-4" />
                    Security Configuration
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <Database className="w-4 h-4" />
                    Database Management
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <Activity className="w-4 h-4" />
                    System Monitoring
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>View and manage system-level logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Log Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              2024-07-10 10:30:00
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-destructive text-destructive-foreground">ERROR</Badge>
                          </TableCell>
                          <TableCell>Database</TableCell>
                          <TableCell>Connection timeout after 30 seconds</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              2024-07-10 10:25:00
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-warning text-warning-foreground">WARNING</Badge>
                          </TableCell>
                          <TableCell>Authentication</TableCell>
                          <TableCell>Multiple failed login attempts detected</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup">
            <BackupRestore />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SuperAdmin;
