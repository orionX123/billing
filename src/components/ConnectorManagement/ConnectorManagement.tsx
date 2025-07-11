
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Settings, Zap, RefreshCw, Trash2, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

interface ConnectorType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon_url?: string;
  config_schema: any;
  supports_oauth: boolean;
  supports_webhook: boolean;
}

interface Connector {
  id: string;
  name: string;
  description?: string;
  type_name: string;
  type_display_name: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  last_sync?: string;
  last_error?: string;
  created_at: string;
  created_by_name?: string;
}

interface SyncLog {
  id: string;
  sync_type: string;
  direction: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_successful: number;
  records_failed: number;
  error_message?: string;
}

const ConnectorManagement = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [connectorTypes, setConnectorTypes] = useState<ConnectorType[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [selectedConnectorType, setSelectedConnectorType] = useState<ConnectorType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [connectorToDelete, setConnectorToDelete] = useState<Connector | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    connector_type_id: "",
    config: {} as any
  });
  const { toast } = useToast();

  const categories = ["all", "accounting", "ecommerce", "payment", "erp", "crm", "api"];
  const statuses = ["all", "active", "inactive", "error", "pending"];

  useEffect(() => {
    loadConnectors();
    loadConnectorTypes();
  }, []);

  const loadConnectors = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockConnectors: Connector[] = [
        {
          id: "1",
          name: "Main Shopify Store",
          description: "Primary e-commerce store integration",
          type_name: "shopify",
          type_display_name: "Shopify",
          category: "ecommerce",
          status: "active",
          last_sync: "2024-07-11T10:30:00Z",
          created_at: "2024-07-01T00:00:00Z",
          created_by_name: "Admin User"
        },
        {
          id: "2",
          name: "Payment Gateway",
          description: "Stripe payment processing",
          type_name: "stripe",
          type_display_name: "Stripe",
          category: "payment",
          status: "active",
          last_sync: "2024-07-11T09:15:00Z",
          created_at: "2024-07-01T00:00:00Z",
          created_by_name: "Admin User"
        }
      ];
      setConnectors(mockConnectors);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load connectors",
        variant: "destructive",
      });
    }
  };

  const loadConnectorTypes = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTypes: ConnectorType[] = [
        {
          id: "1",
          name: "shopify",
          display_name: "Shopify",
          description: "Sync products and orders with Shopify store",
          category: "ecommerce",
          config_schema: {
            type: "object",
            properties: {
              shop_domain: { type: "string", title: "Shop Domain" },
              access_token: { type: "string", title: "Access Token" }
            }
          },
          supports_oauth: false,
          supports_webhook: true
        },
        {
          id: "2",
          name: "stripe",
          display_name: "Stripe",
          description: "Payment processing integration",
          category: "payment",
          config_schema: {
            type: "object",
            properties: {
              secret_key: { type: "string", title: "Secret Key" },
              publishable_key: { type: "string", title: "Publishable Key" }
            }
          },
          supports_oauth: false,
          supports_webhook: true
        }
      ];
      setConnectorTypes(mockTypes);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load connector types",
        variant: "destructive",
      });
    }
  };

  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connector.type_display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || connector.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || connector.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddConnector = () => {
    setSelectedConnector(null);
    setSelectedConnectorType(null);
    setFormData({
      name: "",
      description: "",
      connector_type_id: "",
      config: {}
    });
    setIsFormOpen(true);
  };

  const handleEditConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    const connectorType = connectorTypes.find(t => t.name === connector.type_name);
    setSelectedConnectorType(connectorType || null);
    setFormData({
      name: connector.name,
      description: connector.description || "",
      connector_type_id: connectorType?.id || "",
      config: {}
    });
    setIsFormOpen(true);
  };

  const handleDeleteConnector = (connector: Connector) => {
    setConnectorToDelete(connector);
    setIsDeleteDialogOpen(true);
  };

  const handleSync = async (connectorId: string) => {
    try {
      toast({
        title: "Sync Started",
        description: "Data synchronization has been initiated.",
      });
      // Add actual sync API call here
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start synchronization",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (connectorId: string) => {
    try {
      toast({
        title: "Connection Test",
        description: "Testing connection...",
      });
      // Add actual test API call here
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection test failed",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.connector_type_id) {
      toast({
        title: "Validation Error",
        description: "Name and connector type are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedConnector) {
        toast({
          title: "Success",
          description: "Connector updated successfully.",
        });
      } else {
        toast({
          title: "Success",
          description: "Connector created successfully.",
        });
      }
      
      setIsFormOpen(false);
      loadConnectors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save connector",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteConnector = async () => {
    if (connectorToDelete) {
      try {
        toast({
          title: "Connector Deleted",
          description: `${connectorToDelete.name} has been deleted successfully.`,
        });
        setIsDeleteDialogOpen(false);
        setConnectorToDelete(null);
        loadConnectors();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete connector",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ecommerce': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'accounting': return 'bg-purple-100 text-purple-800';
      case 'erp': return 'bg-orange-100 text-orange-800';
      case 'crm': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderConfigForm = () => {
    if (!selectedConnectorType) return null;

    const schema = selectedConnectorType.config_schema;
    if (!schema || !schema.properties) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium">Configuration</h4>
        {Object.entries(schema.properties).map(([key, field]: [string, any]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{field.title || key}</Label>
            <Input
              id={key}
              type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? 'password' : 'text'}
              value={formData.config[key] || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                config: { ...prev.config, [key]: e.target.value }
              }))}
              placeholder={field.description || `Enter ${field.title || key}`}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Connector Management</h1>
          <p className="text-muted-foreground">Manage integrations with external systems</p>
        </div>
        <Button onClick={handleAddConnector} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Connector
        </Button>
      </div>

      <Tabs defaultValue="connectors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
          <TabsTrigger value="types">Available Types</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="connectors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Connectors</CardTitle>
              <CardDescription>Manage your system integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search connectors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConnectors.map((connector) => (
                      <TableRow key={connector.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{connector.name}</div>
                            {connector.description && (
                              <div className="text-sm text-muted-foreground">{connector.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{connector.type_display_name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(connector.category)}>
                            {connector.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(connector.status)}
                            <Badge className={getStatusColor(connector.status)}>
                              {connector.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {connector.last_sync 
                              ? new Date(connector.last_sync).toLocaleString()
                              : "Never"
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTest(connector.id)}
                              title="Test Connection"
                            >
                              <Zap className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSync(connector.id)}
                              title="Sync Now"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditConnector(connector)}
                              title="Edit"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteConnector(connector)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectorTypes.map((type) => (
              <Card key={type.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{type.display_name}</CardTitle>
                    <Badge className={getCategoryColor(type.category)}>
                      {type.category}
                    </Badge>
                  </div>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">OAuth:</span>
                      <Badge variant={type.supports_oauth ? "default" : "secondary"}>
                        {type.supports_oauth ? "Supported" : "Not Supported"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Webhooks:</span>
                      <Badge variant={type.supports_webhook ? "default" : "secondary"}>
                        {type.supports_webhook ? "Supported" : "Not Supported"}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      setSelectedConnectorType(type);
                      setFormData(prev => ({ ...prev, connector_type_id: type.id }));
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Connector
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Logs</CardTitle>
              <CardDescription>View sync history and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>No sync logs available</p>
                <p className="text-sm">Sync logs will appear here after running synchronizations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connector Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedConnector ? "Edit Connector" : "Add New Connector"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter connector name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="connector_type">Type *</Label>
                <Select 
                  value={formData.connector_type_id} 
                  onValueChange={(value) => {
                    const type = connectorTypes.find(t => t.id === value);
                    setSelectedConnectorType(type || null);
                    setFormData(prev => ({ ...prev, connector_type_id: value, config: {} }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectorTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
              />
            </div>

            {renderConfigForm()}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedConnector ? "Update Connector" : "Create Connector"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setConnectorToDelete(null);
        }}
        onConfirm={confirmDeleteConnector}
        title="Delete Connector"
        description={`Are you sure you want to delete "${connectorToDelete?.name}"? This action cannot be undone and will stop all data synchronization.`}
        confirmText="Delete Connector"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default ConnectorManagement;
