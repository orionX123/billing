import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  AlertTriangle,
  Database,
  Globe,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SyncRecord {
  id: string;
  invoiceId: string;
  syncDate: string;
  status: 'success' | 'failed' | 'pending';
  attempts: number;
  errorMessage?: string;
  responseTime: number;
}

const IRDIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [syncMode, setSyncMode] = useState<'realtime' | 'batch'>('realtime');
  const [syncInterval, setSyncInterval] = useState('5');
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([
    {
      id: '1',
      invoiceId: 'INV-2024-001',
      syncDate: '2024-07-05 15:30:25',
      status: 'success',
      attempts: 1,
      responseTime: 245
    },
    {
      id: '2',
      invoiceId: 'INV-2024-002',
      syncDate: '2024-07-05 15:28:10',
      status: 'success',
      attempts: 1,
      responseTime: 189
    },
    {
      id: '3',
      invoiceId: 'INV-2024-003',
      syncDate: '2024-07-05 15:25:45',
      status: 'failed',
      attempts: 3,
      errorMessage: 'Connection timeout',
      responseTime: 5000
    }
  ]);

  const { toast } = useToast();

  // Simulate real-time sync updates
  useEffect(() => {
    if (syncMode === 'realtime' && connectionStatus === 'connected') {
      const interval = setInterval(() => {
        setLastSyncTime(new Date());
      }, parseInt(syncInterval) * 1000);
      
      return () => clearInterval(interval);
    }
  }, [syncMode, syncInterval, connectionStatus]);

  const handleTestConnection = async () => {
    setConnectionStatus('connecting');
    toast({
      title: "Testing Connection",
      description: "Testing connection to IRD CBMS...",
    });

    // Simulate API call
    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // 70% success rate
      setConnectionStatus(isSuccess ? 'connected' : 'disconnected');
      
      toast({
        title: isSuccess ? "Connection Successful" : "Connection Failed",
        description: isSuccess 
          ? "Successfully connected to IRD CBMS" 
          : "Failed to connect to IRD CBMS. Please check your settings.",
        variant: isSuccess ? "default" : "destructive",
      });
    }, 2000);
  };

  const handleManualSync = () => {
    toast({
      title: "Manual Sync Started",
      description: "Syncing pending invoices with IRD CBMS...",
    });

    // Simulate sync process
    setTimeout(() => {
      const newRecord: SyncRecord = {
        id: (syncRecords.length + 1).toString(),
        invoiceId: `INV-2024-${String(syncRecords.length + 4).padStart(3, '0')}`,
        syncDate: new Date().toLocaleString(),
        status: 'success',
        attempts: 1,
        responseTime: Math.floor(Math.random() * 500) + 100
      };

      setSyncRecords([newRecord, ...syncRecords]);
      setLastSyncTime(new Date());

      toast({
        title: "Sync Completed",
        description: "All pending invoices have been synced with IRD CBMS.",
      });
    }, 3000);
  };

  const handleRetrySyncFailures = () => {
    const failedRecords = syncRecords.filter(r => r.status === 'failed');
    
    if (failedRecords.length === 0) {
      toast({
        title: "No Failed Records",
        description: "There are no failed sync records to retry.",
      });
      return;
    }

    toast({
      title: "Retrying Failed Syncs",
      description: `Retrying ${failedRecords.length} failed sync records...`,
    });

    // Simulate retry process
    setTimeout(() => {
      setSyncRecords(syncRecords.map(record => 
        record.status === 'failed' 
          ? { ...record, status: 'success', attempts: record.attempts + 1, errorMessage: undefined }
          : record
      ));

      toast({
        title: "Retry Completed",
        description: "Failed sync records have been successfully retried.",
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending': return <Clock className="w-4 h-4 text-warning" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success text-success-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const successRate = Math.round((syncRecords.filter(r => r.status === 'success').length / syncRecords.length) * 100);
  const avgResponseTime = Math.round(syncRecords.reduce((acc, r) => acc + r.responseTime, 0) / syncRecords.length);

  return (
    <div className="space-y-6">
      {/* SuperAdmin Access Notice */}
      <div className="border border-primary/20 rounded-xl p-4 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-primary">SuperAdmin Access Required</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          IRD integration settings and CBMS synchronization are restricted to SuperAdmin users for security and compliance purposes.
        </p>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">IRD CBMS Integration</h2>
          <p className="text-muted-foreground">Real-time integration with Central Billing Monitoring System</p>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <Badge className="bg-success text-success-foreground">
              <Wifi className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : connectionStatus === 'connecting' ? (
            <Badge className="bg-warning text-warning-foreground">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Connecting
            </Badge>
          ) : (
            <Badge className="bg-destructive text-destructive-foreground">
              <WifiOff className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Syncs</p>
                <p className="text-2xl font-bold">{syncRecords.length}</p>
              </div>
              <Database className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-success">Success Rate</p>
                <p className="text-2xl font-bold text-success">{successRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-warning">Avg Response</p>
                <p className="text-2xl font-bold text-warning">{avgResponseTime}ms</p>
              </div>
              <Activity className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-destructive">Failed</p>
                <p className="text-2xl font-bold text-destructive">
                  {syncRecords.filter(r => r.status === 'failed').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Settings */}
      <Card className="shadow-elegant border-0 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            CBMS Connection Settings
          </CardTitle>
          <CardDescription>Configure real-time sync with IRD Central Billing Monitoring System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="syncMode">Sync Mode</Label>
              <Select value={syncMode} onValueChange={(value: 'realtime' | 'batch') => setSyncMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time Sync</SelectItem>
                  <SelectItem value="batch">Batch Sync</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="syncInterval">Sync Interval (seconds)</Label>
              <Input
                id="syncInterval"
                type="number"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                disabled={syncMode === 'batch'}
              />
            </div>
          </div>

          <div className="border border-primary/20 rounded-xl p-4 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-primary">CBMS Status</h4>
              </div>
              <div className="text-sm text-muted-foreground">
                Last sync: {lastSyncTime.toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Endpoint Status</p>
                <p className="text-muted-foreground">https://cbms.ird.gov.np/api/v1</p>
              </div>
              <div>
                <p className="font-medium">API Version</p>
                <p className="text-muted-foreground">v1.2.0</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleTestConnection} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connecting' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={handleManualSync} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Manual Sync
            </Button>
            <Button onClick={handleRetrySyncFailures} variant="outline">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Retry Failures
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card className="shadow-elegant border-0 bg-gradient-card">
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization activities with IRD CBMS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Sync Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Error Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono">{record.invoiceId}</TableCell>
                    <TableCell className="font-mono text-sm">{record.syncDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{record.attempts}</TableCell>
                    <TableCell>
                      <span className={record.responseTime > 1000 ? 'text-destructive' : 'text-success'}>
                        {record.responseTime}ms
                      </span>
                    </TableCell>
                    <TableCell>
                      {record.errorMessage && (
                        <span className="text-destructive text-sm">{record.errorMessage}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IRDIntegration;