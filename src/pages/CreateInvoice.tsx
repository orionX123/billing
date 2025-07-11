
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { productService, Product } from "@/services/productService";

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatRate: number;
  totalAmount: number;
  isManual: boolean;
}

interface InvoiceFormData {
  fiscalYear: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerPAN: string;
  invoiceDate: Date | undefined;
  dueDate: Date | undefined;
  paymentTerms: string;
  paymentMethod: string;
  remarks: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Paid' | 'Unpaid' | 'Overdue';
  createdBy: string;
  updatedBy: string;
}

const CreateInvoice = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerPAN: '',
    invoiceDate: undefined as Date | undefined,
    dueDate: undefined as Date | undefined,
    paymentTerms: 'Net 30',
    paymentMethod: 'Cash',
    remarks: ''
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load products on component mount
    const allProducts = productService.getAllProducts();
    setProducts(allProducts);
  }, []);

  const addItem = (isManual: boolean = false) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      discount: 0,
      vatRate: 13,
      totalAmount: 0,
      isManual
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If product is selected from dropdown, populate fields
    if (field === 'productId' && value && !updatedItems[index].isManual) {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index] = {
          ...updatedItems[index],
          productName: selectedProduct.name,
          hsnCode: selectedProduct.hsnCode || '',
          unit: selectedProduct.unitOfMeasure,
          unitPrice: selectedProduct.price,
          vatRate: selectedProduct.vatRate
        };
      }
    }
    
    // Recalculate total for the item
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = updatedItems[index];
      const lineTotal = (item.quantity * item.unitPrice) - item.discount;
      updatedItems[index] = { ...updatedItems[index], totalAmount: lineTotal };
    }
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let vatAmount = 0;
    let totalAmount = 0;

    items.forEach(item => {
      subtotal += item.quantity * item.unitPrice;
      totalDiscount += item.discount;
    });

    taxableAmount = subtotal - totalDiscount;
    vatAmount = taxableAmount * (items.length > 0 ? items[0].vatRate / 100 : 0);
    totalAmount = taxableAmount + vatAmount;

    return {
      subtotal,
      totalDiscount,
      taxableAmount,
      vatAmount,
      totalAmount
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData({ ...formData, [name]: date });
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.customerAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer address is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.invoiceDate) {
      toast({
        title: "Validation Error",
        description: "Invoice date is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.dueDate) {
      toast({
        title: "Validation Error",
        description: "Due date is required.",
        variant: "destructive",
      });
      return false;
    }

    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the invoice.",
        variant: "destructive",
      });
      return false;
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName.trim()) {
        toast({
          title: "Validation Error",
          description: `Product name is required for item ${i + 1}.`,
          variant: "destructive",
        });
        return false;
      }
      if (item.quantity <= 0) {
        toast({
          title: "Validation Error",
          description: `Quantity must be greater than 0 for item ${i + 1}.`,
          variant: "destructive",
        });
        return false;
      }
      if (item.unitPrice < 0) {
        toast({
          title: "Validation Error",
          description: `Unit price cannot be negative for item ${i + 1}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would normally send the data to your backend API
      // For now, we'll just show a preview or save as draft
      const totals = calculateTotals();
      
      const invoiceData: InvoiceFormData = {
        fiscalYear: "2024-25",
        customerId: formData.customerId || `CUST-${Date.now()}`,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        customerPAN: formData.customerPAN,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        items: items,
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        taxableAmount: totals.taxableAmount,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        status: 'Draft',
        paymentTerms: formData.paymentTerms,
        paymentMethod: formData.paymentMethod,
        remarks: formData.remarks,
        createdBy: 'current-user',
        updatedBy: 'current-user'
      };

      // Log the invoice data for debugging
      console.log('Invoice data prepared:', invoiceData);

      toast({
        title: "Success",
        description: "Invoice form validated successfully! Ready to create invoice.",
      });

      // You can now either:
      // 1. Show a preview modal
      // 2. Navigate to a preview page
      // 3. Actually create the invoice via API call
      // For now, we'll just show success and stay on the form

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to process invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item before saving as draft.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would save as draft to your backend
      console.log('Saving draft...');
      
      toast({
        title: "Success",
        description: "Invoice saved as draft.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice for your customer</p>
        </div>

        {/* Invoice Form */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Enter customer and invoice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Information */}
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="Enter customer email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="Enter customer phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPAN">Customer PAN</Label>
                  <Input
                    id="customerPAN"
                    name="customerPAN"
                    value={formData.customerPAN}
                    onChange={handleInputChange}
                    placeholder="Enter customer PAN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <DatePicker
                    date={formData.invoiceDate}
                    onSelect={(date) => handleDateChange('invoiceDate', date)}
                    placeholder="Select invoice date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <DatePicker
                    date={formData.dueDate}
                    onSelect={(date) => handleDateChange('dueDate', date)}
                    placeholder="Select due date"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Customer Address *</Label>
                <Textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleInputChange}
                  placeholder="Enter customer address"
                  required
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Invoice Items</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addItem(false)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Select Product
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addItem(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Manual Entry
                    </Button>
                  </div>
                </div>
                
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>HSN Code</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>VAT Rate</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.isManual ? (
                              <Input
                                value={item.productName}
                                onChange={(e) => updateItem(index, 'productName', e.target.value)}
                                placeholder="Product name"
                              />
                            ) : (
                              <Select
                                value={item.productId}
                                onValueChange={(value) => updateItem(index, 'productId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} - NPR {product.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.hsnCode}
                              onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                              placeholder="HSN Code"
                              disabled={!item.isManual && !!item.productId}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                              placeholder="Unit"
                              disabled={!item.isManual && !!item.productId}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.vatRate}
                              onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              NPR {item.totalAmount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-muted-foreground mb-4">No items added yet</p>
                    <div className="flex gap-2 justify-center">
                      <Button type="button" variant="outline" onClick={() => addItem(false)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Select Product
                      </Button>
                      <Button type="button" variant="outline" onClick={() => addItem(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Manual Entry
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals */}
              {items.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-right space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">NPR {calculateTotals().subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Discount:</span>
                      <span className="font-medium">NPR {calculateTotals().totalDiscount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxable Amount:</span>
                      <span className="font-medium">NPR {calculateTotals().taxableAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT Amount:</span>
                      <span className="font-medium">NPR {calculateTotals().vatAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>NPR {calculateTotals().totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="eSewa">eSewa</SelectItem>
                      <SelectItem value="Khalti">Khalti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter any remarks"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Create Invoice"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/invoices')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CreateInvoice;
