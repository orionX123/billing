
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Edit, Trash2, Package, DollarSign, TrendingUp, AlertTriangle, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { Product, productService } from "@/services/productService";
import ProductViewer from "@/components/Product/ProductViewer";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

const Products = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    try {
      const allProducts = productService.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    }
  };

  const categories = productService.getCategories();

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.status === "Active") ||
      (statusFilter === "inactive" && product.status === "Inactive") ||
      (statusFilter === "low-stock" && product.stock <= product.minStockLevel);
    
    return matchesSearch && matchesCategory && matchesStatus && product.isActive;
  });

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewerOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/products/create?edit=${product.id}`);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      try {
        productService.deleteProduct(productToDelete.id);
        loadProducts();
        toast({
          title: "Product Deleted",
          description: `Product "${productToDelete.name}" has been deleted successfully.`,
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleCreateNewProduct = () => {
    navigate('/products/create');
  };

  const getStockBadgeColor = (product: Product) => {
    if (product.stock <= 0) return 'destructive';
    if (product.stock <= product.minStockLevel) return 'secondary';
    return 'default';
  };

  const getStockStatusText = (product: Product) => {
    if (product.stock <= 0) return 'Out of Stock';
    if (product.stock <= product.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getProductStats = () => {
    const activeProducts = filteredProducts.filter(p => p.status === 'Active');
    const totalValue = activeProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const lowStockCount = activeProducts.filter(product => product.stock <= product.minStockLevel).length;
    const outOfStockCount = activeProducts.filter(product => product.stock <= 0).length;
    
    return {
      totalProducts: activeProducts.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      avgPrice: activeProducts.length > 0 ? totalValue / activeProducts.reduce((sum, p) => sum + p.stock, 0) : 0
    };
  };

  const stats = getProductStats();

  return (
    <MainLayout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <Button onClick={handleCreateNewProduct} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Products</div>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Inventory Value</div>
                  <div className="text-2xl font-bold">NPR {stats.totalValue.toLocaleString()}</div>
                </div>
                <DollarSign className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Avg. Price</div>
                  <div className="text-2xl font-bold">NPR {Math.round(stats.avgPrice).toLocaleString()}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-warning">Low Stock</div>
                  <div className="text-2xl font-bold text-warning">{stats.lowStockCount}</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-destructive">Out of Stock</div>
                  <div className="text-2xl font-bold text-destructive">{stats.outOfStockCount}</div>
                </div>
                <Tag className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Management */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>View and manage all your products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products by name, SKU, or barcode..."
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
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                            {product.barcode && ` | Barcode: ${product.barcode}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.category}</div>
                          {product.brand && (
                            <div className="text-sm text-muted-foreground">{product.brand}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">NPR {product.price.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            Cost: NPR {product.costPrice.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {product.stock} {product.unitOfMeasure}
                          </div>
                          <Badge variant={getStockBadgeColor(product)} className="text-xs">
                            {getStockStatusText(product)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewProduct(product)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product)}
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {products.filter(p => p.isActive).length === 0 
                    ? "No products found. Click 'Add Product' to create your first product."
                    : "No products found matching your search criteria."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Viewer Dialog */}
        <ProductViewer
          product={selectedProduct}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedProduct(null);
          }}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
          }}
          onConfirm={confirmDeleteProduct}
          title="Delete Product"
          description={`Are you sure you want to delete product "${productToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete Product"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
};

export default Products;
