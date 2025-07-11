import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  Package,
  AlertTriangle,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { invoiceService } from "@/services/invoiceService";
import { customerService } from "@/services/customerService";
import { productService } from "@/services/productService";

const Dashboard = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState(customerService.getAllCustomers());
  const [products, setProducts] = useState(productService.getAllProducts());

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fix: properly handle the async response
        const response = await invoiceService.getAllInvoices();
        const activeInvoices = response.invoices.filter(inv => inv.isActive);
        setInvoices(activeInvoices);
        setCustomers(customerService.getAllCustomers());
        setProducts(productService.getAllProducts());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to empty array on error
        setInvoices([]);
      }
    };

    loadData();
  }, []);

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const lowStockProducts = productService.getLowStockProducts();

  const stats = [
    {
      title: "Total Revenue",
      value: `NPR ${totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Invoices",
      value: invoices.length.toString(),
      change: `+${invoices.filter(inv => inv.createdDate === new Date().toISOString().split('T')[0]).length}`,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Customers",
      value: customers.length.toString(),
      change: `+${customers.filter(c => c.createdDate === new Date().toISOString().split('T')[0]).length}`,
      icon: Users,
      color: "text-secondary",
    },
    {
      title: "Products",
      value: products.length.toString(),
      change: `${lowStockProducts.length} low stock`,
      icon: Package,
      color: "text-warning",
    },
  ];

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'sent': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <MainLayout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your business.</p>
          </div>
          <Link to="/invoices/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-gradient-card shadow-card hover:shadow-md transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest invoice transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                      <p className="text-xs text-muted-foreground">{invoice.invoiceDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">NPR {invoice.totalAmount.toLocaleString()}</p>
                      {invoice.syncedWithIRD && (
                        <Badge variant="outline" className="text-xs">IRD Synced</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {recentInvoices.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No invoices found. Create your first invoice to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card className="shadow-elegant border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Products running low on inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products
                  .filter(product => product.stock <= product.minStockLevel)
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg bg-background/50">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{product.stock} left</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Min: {product.minStockLevel}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/invoices/create">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  Create Invoice
                </Button>
              </Link>
              <Link to="/customers">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Users className="w-6 h-6" />
                  Manage Customers
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Package className="w-6 h-6" />
                  Manage Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
