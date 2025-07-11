import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Download, Filter, Calendar as CalendarIcon, Shield, FileText, User, Settings } from "lucide-react";
import { format } from "date-fns";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  location: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "AUDIT-001",
    timestamp: "2024-07-10T14:30:00Z",
    userId: "USR-001",
    username: "admin",
    action: "Login",
    resource: "Authentication",
    details: "Successful login",
    ipAddress: "192.168.1.1",
    location: "Kathmandu, Nepal"
  },
  {
    id: "AUDIT-002",
    timestamp: "2024-07-10T14:45:00Z",
    userId: "USR-002",
    username: "manager",
    action: "Create",
    resource: "Invoice",
    details: "Created invoice INV-005",
    ipAddress: "10.0.0.5",
    location: "Bhaktapur, Nepal"
  },
  {
    id: "AUDIT-003",
    timestamp: "2024-07-10T15:00:00Z",
    userId: "USR-001",
    username: "admin",
    action: "Update",
    resource: "Product",
    details: "Updated product PROD-010",
    ipAddress: "192.168.1.1",
    location: "Kathmandu, Nepal"
  },
  {
    id: "AUDIT-004",
    timestamp: "2024-07-10T15:15:00Z",
    userId: "USR-003",
    username: "cashier",
    action: "Delete",
    resource: "Customer",
    details: "Deleted customer CUST-022",
    ipAddress: "172.16.0.10",
    location: "Lalitpur, Nepal"
  },
  {
    id: "AUDIT-005",
    timestamp: "2024-07-10T15:30:00Z",
    userId: "USR-002",
    username: "manager",
    action: "Logout",
    resource: "Authentication",
    details: "Successful logout",
    ipAddress: "10.0.0.5",
    location: "Bhaktapur, Nepal"
  }
];

const Audit = () => {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    // Simulate loading audit logs from an API
    setTimeout(() => {
      setAuditLogs(mockAuditLogs);
    }, 500);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return User;
      case 'logout': return User;
      case 'create': return FileText;
      case 'update': return Settings;
      case 'delete': return Shield;
      default: return FileText;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'create': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionType = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action.toLowerCase() === actionFilter.toLowerCase();

    const matchesDateRange = (!startDate || !endDate ||
      (new Date(log.timestamp) >= startDate && new Date(log.timestamp) <= endDate));

    return matchesSearch && matchesAction && matchesDateRange;
  });

  const handleDownload = () => {
    toast({
      title: "Download Initiated",
      description: "Audit logs will be downloaded shortly.",
    });
  };

  return (
    <MainLayout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track and monitor system activities</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-64"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{startDate ? format(startDate, "MMM dd, yyyy") : "Select Date"}</span>
                  -
                  <span>{endDate ? format(endDate, "MMM dd, yyyy") : "Select Date"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="range"
                  defaultMonth={startDate ? startDate : new Date()}
                  selected={startDate && endDate ? { from: startDate, to: endDate } : undefined}
                  onSelect={(date) => {
                    if (date && 'from' in date && 'to' in date) {
                      setStartDate(date.from);
                      setEndDate(date.to);
                    } else {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download Logs
            </Button>
          </div>
        </div>

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>A log of all user actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.username}</div>
                            <div className="text-sm text-muted-foreground">User ID: {log.userId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ActionIcon className="w-4 h-4" />
                            <Badge className={getActionColor(log.action)}>
                              {formatActionType(log.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell>{log.details}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{log.location}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Audit;
