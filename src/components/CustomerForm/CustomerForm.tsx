
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Customer, customerService } from "@/services/customerService";

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess: () => void;
}

const CustomerForm = ({ isOpen, onClose, customer, onSuccess }: CustomerFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    vatNumber: customer?.vatNumber || "",
    panNumber: customer?.panNumber || "",
    status: customer?.status || "Active",
    customerType: customer?.customerType || "Business",
    billingAddress: customer?.billingAddress || "",
    shippingAddress: customer?.shippingAddress || "",
    creditLimit: customer?.creditLimit || 0,
    paymentTerms: customer?.paymentTerms || "Net 30"
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (customer) {
        // Update existing customer
        customerService.updateCustomer(customer.id, formData);
        toast({
          title: "Customer Updated",
          description: `${formData.name} has been successfully updated.`,
        });
      } else {
        // Create new customer
        customerService.createCustomer(formData);
        toast({
          title: "Customer Created",
          description: `${formData.name} has been successfully created.`,
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {customer ? "Update customer information" : "Create a new customer record with IRD-compliant fields"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>Core customer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerType">Customer Type</Label>
                  <Select value={formData.customerType} onValueChange={(value) => handleChange("customerType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">IRD Compliance Information</CardTitle>
              <CardDescription>Tax identification numbers as per IRD requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vatNumber">VAT Number *</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => handleChange("vatNumber", e.target.value)}
                    placeholder="Enter VAT registration number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => handleChange("panNumber", e.target.value)}
                    placeholder="Enter PAN number"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address Information</CardTitle>
              <CardDescription>Physical and billing addresses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Primary Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => handleChange("billingAddress", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Input
                    id="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={(e) => handleChange("shippingAddress", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Terms</CardTitle>
              <CardDescription>Credit and payment terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditLimit">Credit Limit (NPR)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => handleChange("creditLimit", parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={formData.paymentTerms} onValueChange={(value) => handleChange("paymentTerms", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {customer ? "Update Customer" : "Create Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerForm;
