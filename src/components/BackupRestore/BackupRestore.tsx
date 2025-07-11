
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Database, HardDrive, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    customers: any[];
    products: any[];
    invoices: any[];
    users: any[];
    settings: any;
  };
  metadata: {
    totalRecords: number;
    backupSize: string;
    createdBy: string;
  };
}

const BackupRestore = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupNotes, setBackupNotes] = useState("");
  const { toast } = useToast();

  const getAllData = () => {
    const customers = JSON.parse(localStorage.getItem('ird_customers') || '[]');
    const products = JSON.parse(localStorage.getItem('ird_products') || '[]');
    const invoices = JSON.parse(localStorage.getItem('ird_invoices') || '[]');
    const users = JSON.parse(localStorage.getItem('ird_users') || '[]');
    const settings = JSON.parse(localStorage.getItem('ird_settings') || '{}');

    return { customers, products, invoices, users, settings };
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      const data = getAllData();
      const totalRecords = data.customers.length + data.products.length + data.invoices.length + data.users.length;
      
      const backupData: BackupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          totalRecords,
          backupSize: `${JSON.stringify(data).length} bytes`,
          createdBy: "admin"
        }
      };

      // Add backup notes if provided
      if (backupNotes.trim()) {
        (backupData as any).notes = backupNotes.trim();
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `ird-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save backup record
      const backupHistory = JSON.parse(localStorage.getItem('backup_history') || '[]');
      backupHistory.unshift({
        id: `BKP-${Date.now()}`,
        timestamp: backupData.timestamp,
        totalRecords,
        notes: backupNotes.trim() || 'No notes provided',
        createdBy: 'admin'
      });
      localStorage.setItem('backup_history', JSON.stringify(backupHistory.slice(0, 10))); // Keep last 10

      toast({
        title: "Backup Created",
        description: `Database backup created successfully with ${totalRecords} records.`,
      });

      setBackupNotes("");
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON backup file.",
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);

    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // Validate backup structure
      if (!backupData.version || !backupData.data) {
        throw new Error("Invalid backup file structure");
      }

      // Confirm restore
      const confirmRestore = window.confirm(
        `This will replace all current data with the backup data from ${new Date(backupData.timestamp).toLocaleString()}.\n\n` +
        `Records to restore:\n` +
        `- Customers: ${backupData.data.customers?.length || 0}\n` +
        `- Products: ${backupData.data.products?.length || 0}\n` +
        `- Invoices: ${backupData.data.invoices?.length || 0}\n` +
        `- Users: ${backupData.data.users?.length || 0}\n\n` +
        `Are you sure you want to continue?`
      );

      if (!confirmRestore) {
        setIsRestoring(false);
        return;
      }

      // Restore data
      if (backupData.data.customers) {
        localStorage.setItem('ird_customers', JSON.stringify(backupData.data.customers));
      }
      if (backupData.data.products) {
        localStorage.setItem('ird_products', JSON.stringify(backupData.data.products));
      }
      if (backupData.data.invoices) {
        localStorage.setItem('ird_invoices', JSON.stringify(backupData.data.invoices));
      }
      if (backupData.data.users) {
        localStorage.setItem('ird_users', JSON.stringify(backupData.data.users));
      }
      if (backupData.data.settings) {
        localStorage.setItem('ird_settings', JSON.stringify(backupData.data.settings));
      }

      toast({
        title: "Restore Completed",
        description: `Database restored successfully from backup created on ${new Date(backupData.timestamp).toLocaleString()}.`,
      });

      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore from backup. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      event.target.value = ''; // Reset file input
    }
  };

  const getBackupHistory = () => {
    return JSON.parse(localStorage.getItem('backup_history') || '[]');
  };

  const getDataStats = () => {
    const data = getAllData();
    return {
      customers: data.customers.length,
      products: data.products.length,
      invoices: data.invoices.length,
      users: data.users.length,
      lastUpdated: new Date().toISOString()
    };
  };

  const stats = getDataStats();
  const backupHistory = getBackupHistory();

  return (
    <div className="space-y-6">
      {/* Current Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Current Database Status
          </CardTitle>
          <CardDescription>Overview of your current data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.customers}</div>
              <div className="text-sm text-muted-foreground">Customers</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.products}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.invoices}</div>
              <div className="text-sm text-muted-foreground">Invoices</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.users}</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Create Backup
            </CardTitle>
            <CardDescription>
              Export all your data for safekeeping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backupNotes">Backup Notes (Optional)</Label>
              <Textarea
                id="backupNotes"
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                placeholder="Add notes about this backup (e.g., 'Before system update', 'End of month backup')"
                rows={3}
              />
            </div>
            
            <Button 
              onClick={createBackup} 
              disabled={isCreatingBackup}
              className="w-full gap-2"
            >
              <HardDrive className="w-4 h-4" />
              {isCreatingBackup ? "Creating Backup..." : "Create Backup"}
            </Button>

            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded">
              <strong>Note:</strong> The backup file will contain all customers, products, invoices, users, and settings. 
              Keep this file secure as it contains sensitive business data.
            </div>
          </CardContent>
        </Card>

        {/* Restore Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Restore Backup
            </CardTitle>
            <CardDescription>
              Import data from a backup file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backupFile">Select Backup File</Label>
              <Input
                id="backupFile"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isRestoring}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-destructive bg-destructive/10 p-3 rounded border border-destructive/20">
                <strong>Warning:</strong> Restoring a backup will replace ALL current data. 
                This action cannot be undone. Make sure to create a backup first if you want to preserve current data.
              </div>
            </div>

            {isRestoring && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">Restoring data...</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Backups
            </CardTitle>
            <CardDescription>
              History of your recent backup operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backupHistory.map((backup: any, index: number) => (
                <div key={backup.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {new Date(backup.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {backup.totalRecords} records • {backup.notes}
                      </div>
                    </div>
                  </div>
                  <Badge variant={index === 0 ? "default" : "outline"}>
                    {index === 0 ? "Latest" : `${index + 1} ago`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackupRestore;
