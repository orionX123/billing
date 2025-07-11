
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product, productService } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductForm = ({ product, isOpen, onClose, onSuccess }: ProductFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category: "",
    price: 0,
    costPrice: 0,
    unit: "pieces",
    stockQuantity: 0,
    minStockLevel: 0,
    vatRate: 13,
    hsnCode: "",
    brand: "",
    supplier: "",
    isActive: true,
    createdBy: "admin",
    updatedBy: "admin",
    status: "Active" as "Active" | "Inactive",
    stock: 0,
    unitOfMeasure: "pieces",
    reorderPoint: 0,
    supplierInfo: "",
    updatedDate: new Date().toISOString()
  });

  const units = ["pieces", "kg", "grams", "liters", "meters", "boxes", "sets", "pairs"];
  const categories = ["Electronics", "Clothing", "Food & Beverages", "Books", "Home & Garden", "Sports", "Toys", "Other"];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        sku: product.sku,
        barcode: product.barcode || "",
        category: product.category,
        price: product.price,
        costPrice: product.costPrice,
        unit: product.unit,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        vatRate: product.vatRate,
        hsnCode: product.hsnCode || "",
        brand: product.brand || "",
        supplier: product.supplier || "",
        isActive: product.isActive,
        createdBy: product.createdBy,
        updatedBy: "admin",
        status: product.status,
        stock: product.stock,
        unitOfMeasure: product.unitOfMeasure,
        reorderPoint: product.reorderPoint,
        supplierInfo: product.supplierInfo || "",
        updatedDate: new Date().toISOString()
      });
    } else {
      setFormData({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        category: "",
        price: 0,
        costPrice: 0,
        unit: "pieces",
        stockQuantity: 0,
        minStockLevel: 0,
        vatRate: 13,
        hsnCode: "",
        brand: "",
        supplier: "",
        isActive: true,
        createdBy: "admin",
        updatedBy: "admin",
        status: "Active" as "Active" | "Inactive",
        stock: 0,
        unitOfMeasure: "pieces",
        reorderPoint: 0,
        supplierInfo: "",
        updatedDate: new Date().toISOString()
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.sku.trim()) {
      toast({
        title: "Validation Error",
        description: "SKU is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Category is required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        ...formData,
        stock: formData.stockQuantity // Keep both in sync
      };

      if (product) {
        productService.updateProduct(product.id, productData);
        toast({
          title: "Success",
          description: "Product updated successfully.",
        });
      } else {
        productService.createProduct(productData);
        toast({
          title: "Success",
          description: "Product created successfully.",
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Enter SKU"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange("barcode", e.target.value)}
                placeholder="Enter barcode"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Selling Price (NPR) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (NPR)</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleInputChange("costPrice", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange("stockQuantity", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => handleInputChange("minStockLevel", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatRate">VAT Rate (%)</Label>
              <Input
                id="vatRate"
                type="number"
                min="0"
                max="100"
                value={formData.vatRate}
                onChange={(e) => handleInputChange("vatRate", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                value={formData.hsnCode}
                onChange={(e) => handleInputChange("hsnCode", e.target.value)}
                placeholder="Enter HSN code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="Enter brand name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleInputChange("supplier", e.target.value)}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
