import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Building2, 
  Plus, 
  Edit, 
  Pause, 
  Play, 
  Eye,
  Search,
  Users,
  Calendar,
  CreditCard,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tenant, tenantService } from "@/services/tenantService";

const tenantSchema = z.object({
  name: z.string().min(2, "Tenant name is required"),
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters"),
  businessType: z.enum(['retail', 'restaurant', 'service', 'wholesale']),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email address"),
  panNumber: z.string().min(9, "PAN number is required"),
  vatNumber: z.string().min(9, "VAT number is required"),
  plan: z.enum(['basic', 'standard', 'premium', 'enterprise']),
  maxUsers: z.number().min(1, "At least 1 user required"),
  maxLocations: z.number().min(1, "At least 1 location required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>(tenantService.getAllTenants());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof tenantSchema>>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      businessType: "retail",
      address: "",
      phone: "",
      email: "",
      panNumber: "",
      vatNumber: "",
      plan: "standard",
      maxUsers: 5,
      maxLocations: 1,
      expiryDate: "",
    },
  });

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'suspended': return 'bg-destructive text-destructive-foreground';
      case 'trial': return 'bg-warning text-warning-foreground';
      case 'expired': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-primary text-primary-foreground';
      case 'premium': return 'bg-secondary text-secondary-foreground';
      case 'standard': return 'bg-muted text-muted-foreground';
      case 'basic': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleCreateTenant = (data: z.infer<typeof tenantSchema>) => {
    const newTenant = tenantService.createTenant({
      name: data.name,
      subdomain: data.subdomain,
      businessType: data.businessType,
      address: data.address,
      phone: data.phone,
      email: data.email,
      panNumber: data.panNumber,
      vatNumber: data.vatNumber,
      plan: data.plan,
      maxUsers: data.maxUsers,
      maxLocations: data.maxLocations,
      expiryDate: data.expiryDate,
      fiscalYear: "2081-82",
      status: "trial",
      features: getPlanFeatures(data.plan),
      ownerId: "SUPERUSER-001", // This would come from current user context
      settings: {
        currency: "NPR",
        timezone: "Asia/Kathmandu",
        language: "en",
        dateFormat: "YYYY-MM-DD",
        taxSettings: {
          defaultVatRate: 13,
          enableTax: true,
          taxNumber: data.vatNumber
        },
        posSettings: {
          enableBarcode: true,
          enableInventoryTracking: true,
          enableCustomerDisplay: false,
          enableReceiptPrinter: true,
          defaultPaymentMethod: "cash"
        }
      }
    });

    setTenants([...tenants, newTenant]);
    setIsCreateDialogOpen(false);
    form.reset();
    
    toast({
      title: "Tenant Created",
      description: `${data.name} has been successfully created with subdomain: ${data.subdomain}`,
    });
  };

  const getPlanFeatures = (plan: string): string[] => {
    switch (plan) {
      case 'basic': return ['pos', 'basic-reports'];
      case 'standard': return ['pos', 'inventory', 'reports', 'multi-user'];
      case 'premium': return ['pos', 'inventory', 'reports', 'multi-user', 'multi-location', 'advanced-reports'];
      case 'enterprise': return ['pos', 'inventory', 'reports', 'multi-user', 'multi-location', 'advanced-reports', 'api-access', 'custom-integrations'];
      default: return ['pos'];
    }
  };

  const handleSuspendTenant = (tenantId: string) => {
    tenantService.suspendTenant(tenantId);
    setTenants(tenantService.getAllTenants());
    toast({
      title: "Tenant Suspended",
      description: "Tenant has been suspended successfully.",
    });
  };

  const handleActivateTenant = (tenantId: string) => {
    tenantService.activateTenant(tenantId);
    setTenants(tenantService.getAllTenants());
    toast({
      title: "Tenant Activated",
      description: "Tenant has been activated successfully.",
    });
  };

  const handleViewTenant = (tenant: Tenant) => {
    toast({
      title: "View Tenant",
      description: `Viewing details for ${tenant.name}. Full tenant dashboard would open here.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tenant Management</h2>
          <p className="text-muted-foreground">Manage all tenant organizations and their subscriptions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>Set up a new tenant organization with their business details and subscription plan.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateTenant)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <Input placeholder="business-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="restaurant">Restaurant</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="wholesale">Wholesale</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Plan</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic - NPR 2,000/month</SelectItem>
                              <SelectItem value="standard">Standard - NPR 5,000/month</SelectItem>
                              <SelectItem value="premium">Premium - NPR 10,000/month</SelectItem>
                              <SelectItem value="enterprise">Enterprise - NPR 20,000/month</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@business.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+977-1-1234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Complete business address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Users</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxLocations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Locations</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Create Tenant</Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-success">Active</p>
                <p className="text-2xl font-bold text-success">
                  {tenants.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-warning">Trial</p>
                <p className="text-2xl font-bold text-warning">
                  {tenants.filter(t => t.status === 'trial').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">NPR 2.4L</p>
              </div>
              <CreditCard className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Table */}
      <Card className="shadow-elegant border-0 bg-gradient-card">
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>Manage tenant organizations and their subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tenants Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.subdomain}.pos.com</div>
                        <div className="text-xs text-muted-foreground">{tenant.businessType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(tenant.plan)}>
                        {tenant.plan.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tenant.status)}>
                        {tenant.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{tenant.maxUsers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tenant.expiryDate}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleViewTenant(tenant)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                        {tenant.status === 'active' ? (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleSuspendTenant(tenant.id)}
                          >
                            <Pause className="w-4 h-4 text-warning" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleActivateTenant(tenant.id)}
                          >
                            <Play className="w-4 h-4 text-success" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTenants.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tenants found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantManagement;
