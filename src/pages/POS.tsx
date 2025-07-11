import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Scan, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Plus,
  Minus,
  Trash2,
  Calculator,
  Receipt,
  Search,
  Grid3X3,
  List
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { POSItem, POSTransaction, posService } from "@/services/posService";
import { productService, Product } from "@/services/productService";

const POS = () => {
  const [cart, setCart] = useState<POSItem[]>([]);
  const [products, setProducts] = useState(productService.getAllProducts());
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'mixed'>('cash');
  const [cashReceived, setCashReceived] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const { toast } = useToast();

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory && product.status === 'Active';
  });

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      updateCartItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: POSItem = {
        id: `CART-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        discountType: 'amount',
        vatRate: product.vatRate,
        totalAmount: product.price + (product.price * product.vatRate / 100),
        category: product.category
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unitPrice * newQuantity - item.discount;
        const vatAmount = subtotal * item.vatRate / 100;
        return {
          ...item,
          quantity: newQuantity,
          totalAmount: subtotal + vatAmount
        };
      }
      return item;
    }));
  };

  const updateCartItemDiscount = (itemId: string, discount: number, discountType: 'amount' | 'percentage') => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const discountAmount = discountType === 'percentage' 
          ? (item.unitPrice * item.quantity * discount / 100)
          : discount;
        const subtotal = (item.unitPrice * item.quantity) - discountAmount;
        const vatAmount = subtotal * item.vatRate / 100;
        return {
          ...item,
          discount: discountAmount,
          discountType,
          totalAmount: subtotal + vatAmount
        };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: "", phone: "" });
  };

  const handleBarcodeSearch = () => {
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => p.barcode === barcodeInput || p.sku === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput("");
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode/SKU",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = cart.reduce((sum, item) => {
      const itemSubtotal = (item.unitPrice * item.quantity) - item.discount;
      return sum + (itemSubtotal * item.vatRate / 100);
    }, 0);
    const totalAmount = taxableAmount + taxAmount;

    return { subtotal, totalDiscount, taxableAmount, taxAmount, totalAmount };
  };

  const totals = calculateTotals();

  const handlePayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing payment",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'cash' && cashReceived < totals.totalAmount) {
      toast({
        title: "Insufficient Cash",
        description: "Cash received is less than total amount",
        variant: "destructive",
      });
      return;
    }

    // Create transaction
    const transaction: Omit<POSTransaction, 'id' | 'transactionNumber' | 'timestamp'> = {
      tenantId: "TENANT-001", // This would come from current tenant context
      locationId: "LOC-001",
      cashierId: "USER-001", // This would come from current user context
      cashierName: "Current User",
      customerId: customerInfo.phone ? `CUST-${customerInfo.phone}` : undefined,
      customerName: customerInfo.name || undefined,
      customerPhone: customerInfo.phone || undefined,
      items: cart,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paymentMethod,
      paymentDetails: {
        cash: paymentMethod === 'cash' ? cashReceived : undefined,
        change: paymentMethod === 'cash' ? cashReceived - totals.totalAmount : undefined
      },
      status: 'completed',
      receiptPrinted: false
    };

    const newTransaction = posService.createTransaction(transaction);

    // Update product stock
    cart.forEach(item => {
      productService.updateStock(item.productId, item.quantity, 'subtract');
    });

    toast({
      title: "Payment Successful",
      description: `Transaction ${newTransaction.transactionNumber} completed successfully`,
    });

    // Clear cart and close dialog
    clearCart();
    setIsPaymentDialogOpen(false);
    setCashReceived(0);
    setPaymentMethod('cash');

    // Print receipt (in real implementation)
    console.log("Printing receipt for transaction:", newTransaction);
  };

  return (
    <MainLayout userRole="staff">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
            <p className="text-muted-foreground">Fast and efficient checkout system</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-success text-success-foreground">
              Session Active
            </Badge>
            <Button variant="outline" size="sm">
              End Session
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Products Section */}
          <div className="flex-1 flex flex-col p-4">
            {/* Search and Filters */}
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  className="w-48"
                />
                <Button onClick={handleBarcodeSearch} size="sm">
                  Add
                </Button>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid/List */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                          <p className="font-bold text-primary">NPR {product.price}</p>
                          <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <span className="text-lg">📦</span>
                            </div>
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">{product.sku} • {product.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">NPR {product.price}</p>
                            <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="w-96 border-l bg-muted/20 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length})
                </h2>
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Clear
                </Button>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <Input
                  placeholder="Customer name (optional)"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Customer phone (optional)"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Add products to start a sale</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.productName}</h4>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">NPR {item.totalAmount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">@ NPR {item.unitPrice}</p>
                          </div>
                        </div>

                        {/* Discount Input */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Discount"
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => updateCartItemDiscount(item.id, parseFloat(e.target.value) || 0, item.discountType)}
                            className="text-xs"
                          />
                          <Select 
                            value={item.discountType} 
                            onValueChange={(value: 'amount' | 'percentage') => 
                              updateCartItemDiscount(item.id, item.discount, value)
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="amount">NPR</SelectItem>
                              <SelectItem value="percentage">%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t bg-background">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>NPR {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>- NPR {totals.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>NPR {totals.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>NPR {totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setIsPaymentDialogOpen(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>
                Total Amount: NPR {totals.totalAmount.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Card
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile Payment
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-sm font-medium">Cash Received</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    placeholder="Enter cash amount"
                  />
                  {cashReceived > totals.totalAmount && (
                    <p className="text-sm text-success mt-1">
                      Change: NPR {(cashReceived - totals.totalAmount).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handlePayment} className="flex-1">
                  <Receipt className="w-4 h-4 mr-2" />
                  Complete Sale
                </Button>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default POS;
