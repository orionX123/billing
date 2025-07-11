
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { Customer, customerService } from "@/services/customerService";
import CustomerForm from "@/components/CustomerForm/CustomerForm";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    const allCustomers = customerService.getAllCustomers();
    setCustomers(allCustomers);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.vatNumber.includes(searchTerm) ||
    customer.panNumber.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      const success = customerService.deleteCustomer(customerToDelete.id);
      if (success) {
        loadCustomers();
        toast({
          title: "Customer Deleted",
          description: `${customerToDelete.name} has been successfully deleted.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive",
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const handleViewCustomer = (customer: Customer) => {
    toast({
      title: "Customer Details",
      description: `Viewing details for ${customer.name}. Full customer profile would open here.`,
    });
  };

  const handleFormSuccess = () => {
    loadCustomers();
  };

  return (
    <MainLayout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database with IRD-compliant records</p>
          </div>
          <Button onClick={handleAddCustomer} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
            <CardDescription>Search and manage all your customers with full CRUD operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search customers by name, email, ID, VAT, or PAN number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Customer Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tax Information</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.id}</div>
                          <div className="text-xs text-muted-foreground">{customer.customerType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{customer.email}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                          <div className="text-xs text-muted-foreground">{customer.address}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-mono">VAT: {customer.vatNumber}</div>
                          <div className="text-sm font-mono">PAN: {customer.panNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.totalOrders}</TableCell>
                      <TableCell className="font-semibold">{customer.totalAmount}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={customer.status === 'Active' ? 'default' : 'secondary'}
                          className={customer.status === 'Active' ? 'bg-success text-success-foreground' : ''}
                        >
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCustomer(customer)}
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

            {filteredCustomers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {customers.length === 0 
                    ? "No customers found. Click 'Add Customer' to create your first customer record."
                    : "No customers found matching your search criteria."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Form Dialog */}
        <CustomerForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          customer={selectedCustomer}
          onSuccess={handleFormSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Customer"
          description={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone and will remove all customer data.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
};

export default Customers;
