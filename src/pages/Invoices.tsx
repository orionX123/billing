
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Edit, Trash2, Download, FileText, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { Invoice, invoiceService } from "@/services/invoiceService";
import InvoiceViewer from "@/components/Invoice/InvoiceViewer";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

const Invoices = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoiceService.getAllInvoices();
      setInvoices(response.invoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus && invoice.isActive;
  });

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewerOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    navigate(`/invoices/create?edit=${invoice.id}`);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
        await invoiceService.deleteInvoice(invoiceToDelete.id);
        loadInvoices();
        toast({
          title: "Invoice Deleted",
          description: `Invoice ${invoiceToDelete.invoiceNumber} has been deleted successfully.`,
        });
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast({
          title: "Error",
          description: "Failed to delete invoice. Please try again.",
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleCreateNewInvoice = () => {
    navigate('/invoices/create');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'sent': return 'bg-info text-info-foreground';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      case 'cancelled': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInvoiceStats = () => {
    const activeInvoices = filteredInvoices;
    const totalAmount = activeInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const paidAmount = activeInvoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const pendingAmount = activeInvoices.filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled').reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const overdueCount = activeInvoices.filter(invoice => invoice.status === 'overdue').length;
    
    return {
      totalInvoices: activeInvoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueCount
    };
  };

  const stats = getInvoiceStats();

  return (
    <MainLayout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">Manage your invoices and billing</p>
          </div>
          <Button onClick={handleCreateNewInvoice} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Invoices</div>
                  <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-2xl font-bold">NPR {stats.totalAmount.toLocaleString()}</div>
                </div>
                <DollarSign className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-success">Paid Amount</div>
                  <div className="text-2xl font-bold text-success">NPR {stats.paidAmount.toLocaleString()}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-warning">Pending Amount</div>
                  <div className="text-2xl font-bold text-warning">NPR {stats.pendingAmount.toLocaleString()}</div>
                </div>
                <Calendar className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-destructive">Overdue</div>
                  <div className="text-2xl font-bold text-destructive">{stats.overdueCount}</div>
                </div>
                <Users className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Management */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>View and manage all your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search invoices by number, customer name, or email..."
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
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Invoices Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Print Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            FY: {invoice.fiscalYear}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customerName}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.invoiceDate}</div>
                          <div className="text-sm text-muted-foreground">
                            Due: {invoice.dueDate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">NPR {invoice.totalAmount.toLocaleString()}</div>
                        {invoice.vatAmount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            VAT: NPR {invoice.vatAmount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{invoice.printCount}</span>
                          {invoice.printCount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {invoice.syncedWithIRD ? 'Synced' : 'Pending'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvoice(invoice)}
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

            {filteredInvoices.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {invoices.filter(i => i.isActive).length === 0 
                    ? "No invoices found. Click 'Create Invoice' to create your first invoice."
                    : "No invoices found matching your search criteria."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Viewer Dialog */}
        <InvoiceViewer
          invoice={selectedInvoice}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedInvoice(null);
          }}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setInvoiceToDelete(null);
          }}
          onConfirm={confirmDeleteInvoice}
          title="Delete Invoice"
          description={`Are you sure you want to delete invoice "${invoiceToDelete?.invoiceNumber}"? This action cannot be undone.`}
          confirmText="Delete Invoice"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
};

export default Invoices;
